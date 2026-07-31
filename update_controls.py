import glob
import re

files = glob.glob('components/Editor/Elements/*.tsx')
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if '<TransformControls' in content:
        # Add transformSpace and snapGrid to the store fetch section
        if 'const snapGrid =' not in content:
            content = content.replace('const axisLock = useEditorStore(state => state.axisLock);', 'const axisLock = useEditorStore(state => state.axisLock);\n  const transformSpace = useEditorStore(state => state.transformSpace);\n  const snapGrid = useEditorStore(state => state.snapGrid);')
        
        # Add space={transformSpace} to <TransformControls
        if 'space={' not in content:
            content = re.sub(r'(<TransformControls[^>]*)(showX=\{)', r'\1space={transformSpace} \2', content)
            
        # Replace 0.5 with snapGrid
        content = content.replace('translationSnap={isSnapping ? 0.5 : null}', 'translationSnap={isSnapping ? snapGrid : null}')
        
        # Wait, rotate snap is Math.PI/4. Let's make it proportional to snapGrid. E.g., Math.PI/180 * snapGrid * 90? Or just leave it for now. The plan said snapGrid is just a number.
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated ' + file)
