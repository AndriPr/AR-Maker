import sys

with open('components/Editor/Elements/AnimatedElementWrapper.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const easing = kf1.easing || 'linear';"
replacement = "const easing = kf1.easing || 'ease-in-out';"

if target in content:
    content = content.replace(target, replacement)
    with open('components/Editor/Elements/AnimatedElementWrapper.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
