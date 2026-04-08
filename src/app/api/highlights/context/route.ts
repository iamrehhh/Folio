import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import JSZip from 'jszip';

/**
 * POST /api/highlights/context
 * Fetches the paragraph context for a highlight from the EPUB file.
 * Used for existing highlights that don't have context_paragraph stored.
 *
 * Body: { bookId: string, highlightText: string, highlightId?: string }
 * Returns: { paragraph: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookId, highlightText, highlightId } = await req.json() as {
      bookId: string;
      highlightText: string;
      highlightId?: string;
    };

    if (!bookId || !highlightText) {
      return NextResponse.json({ error: 'Missing bookId or highlightText' }, { status: 400 });
    }

    // Get the book's epub_path
    const { data: book } = await supabase
      .from('books')
      .select('epub_path')
      .eq('id', bookId)
      .single();

    if (!book?.epub_path) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Download the EPUB from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('books')
      .download(book.epub_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Could not download book' }, { status: 500 });
    }

    // Parse the EPUB (it's a ZIP file) using jszip
    const arrayBuffer = await fileData.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Search through all XHTML/HTML content files for the highlighted text
    let paragraph = '';
    const contentFiles = Object.keys(zip.files).filter(
      (name) => /\.(xhtml|html|htm|xml)$/i.test(name) && !name.includes('META-INF')
    );

    for (const filename of contentFiles) {
      const content = await zip.files[filename].async('text');
      if (!content.includes(highlightText)) continue;

      // Found the file containing the highlight text
      // Parse the HTML to extract the surrounding paragraph
      // Use a simple regex-based approach to find <p>...</p> elements
      paragraph = extractParagraph(content, highlightText);
      if (paragraph) break;
    }

    // If we found the paragraph, optionally save it back to the DB
    if (paragraph && highlightId) {
      await supabase
        .from('highlights')
        .update({ context_paragraph: paragraph })
        .eq('id', highlightId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ paragraph });
  } catch (err) {
    console.error('[Highlights Context Error]', err);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}

/**
 * Extract the paragraph containing the highlighted text from HTML content.
 * Handles common EPUB HTML structures.
 */
function extractParagraph(html: string, highlightText: string): string {
  // Strategy: find all text blocks (paragraphs, divs, blockquotes, li)
  // and return the one that contains the highlight text
  const blockPattern = /<(p|div|blockquote|li|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    const blockHtml = match[2];
    // Strip HTML tags to get plain text
    const plainText = blockHtml
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))))
      .replace(/\s+/g, ' ')
      .trim();

    // Check if this block contains the highlighted text
    if (plainText.includes(highlightText)) {
      return plainText;
    }
  }

  // Fallback: try a broader search — look for the text anywhere and grab surrounding context
  const strippedHtml = html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))));

  const lines = strippedHtml
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  // Find the line containing the highlight
  for (const line of lines) {
    if (line.includes(highlightText)) {
      return line;
    }
  }

  return '';
}
