import os

# License Headers for Different File Types
license_headers = {
    ".py": """# Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
""",
    ".js": """/* 
 * Copyright (c) 2025 BunkerIoT
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * http://www.apache.org/licenses/LICENSE-2.0
 * Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
 */
""",
    ".vue": """<!-- 
 Copyright (c) 2025 BunkerIoT

 Licensed under the Apache License, Version 2.0 (the "License");
 You may not use this file except in compliance with the License.
 http://www.apache.org/licenses/LICENSE-2.0
 Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
 -->
""",
}

# File extensions to apply the license to
extensions = tuple(license_headers.keys())

def add_license_to_file(file_path, ext):
    with open(file_path, "r+", encoding="utf-8") as f:
        content = f.read()
        if "Copyright (c) 2025 BunkerIoT" in content:
            return  # Skip files that already have the license
        f.seek(0, 0)
        f.write(license_headers[ext] + content)

# Walk through project folders
for root, _, files in os.walk("."):
    for file in files:
        ext = os.path.splitext(file)[1]
        if ext in license_headers:
            add_license_to_file(os.path.join(root, file), ext)

print("✅ License headers added successfully!")
