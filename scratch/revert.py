import os

search_string = "'Palatino Linotype', 'Book Antiqua', Palatino, serif"
replace_string = "Lora, Georgia, serif"
target_dir = "./src"

def revert_files():
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith((".tsx", ".ts", ".css")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                if search_string in content:
                    new_content = content.replace(search_string, replace_string)
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Reverted in {file_path}")

if __name__ == "__main__":
    revert_files()
