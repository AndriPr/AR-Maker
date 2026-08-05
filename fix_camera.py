import sys

with open('components/Editor/Elements/CameraController.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "enableDamping={false}"
replacement = "enableDamping={true}\n      dampingFactor={0.05}"

if target in content:
    content = content.replace(target, replacement)
    with open('components/Editor/Elements/CameraController.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
