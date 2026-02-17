#!/usr/bin/env python3
"""Remove isDark conditional patterns from React components, replacing with CSS variable approach."""
import re
import sys

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Remove useThemeStore import
    content = content.replace(
        "import { useDataStore, useThemeStore } from '../../store/useStore';",
        "import { useDataStore } from '../../store/useStore';"
    )
    content = content.replace(
        "import { useThemeStore } from '../store/useStore';",
        ""
    )
    
    # Remove isDark variable declarations
    content = content.replace("  const { theme } = useThemeStore();\n", '')
    content = content.replace("  const isDark = theme === 'dark';\n", '')
    
    # Replace template literal className patterns with isDark ternaries
    # Pattern: `some-classes ${isDark ? 'dark-classes' : 'light-classes'} more-classes`
    # Replace with: "some-classes more-classes"
    # This regex handles single isDark ternary in a template literal
    def replace_ternary(match):
        prefix = match.group(1) or ''
        suffix = match.group(4) or ''
        # Clean up extra whitespace
        result = (prefix + ' ' + suffix).strip()
        result = re.sub(r'\s+', ' ', result)
        return '"' + result + '"'
    
    # Handle pattern: `prefix ${isDark ? 'x' : 'y'} suffix`
    pattern = r'`([^`$]*?)\$\{isDark\s*\?\s*\'([^\']*)\'\s*:\s*\'([^\']*)\'\}([^`]*?)`'
    content = re.sub(pattern, replace_ternary, content)
    
    # Handle pattern: `prefix ${isDark \n  ? 'x' \n  : 'y'} suffix` (multiline)
    pattern_ml = r'`([^`$]*?)\$\{isDark\s*\n\s*\?\s*\'([^\']*)\'\s*\n\s*:\s*\'([^\']*)\'\}([^`]*?)`'
    content = re.sub(pattern_ml, replace_ternary, content)
    
    # Handle remaining isDark patterns with more complex ternaries
    # Pattern: isDark ? 'x' : 'y' inside ${}
    pattern2 = r'\$\{isDark\s*\?\s*\'([^\']*)\'\s*:\s*\'([^\']*)\'\}'
    content = re.sub(pattern2, '', content)
    
    # Handle ternary with template literal on multi-line 
    pattern3 = r'\$\{isDark\s*\n\s*\?\s*\'([^\']*)\'\s*\n\s*:\s*\'([^\']*)\'\}'
    content = re.sub(pattern3, '', content)
    
    # Clean empty backtick strings
    content = content.replace('``', '""')
    
    # Replace rounded-lg with rounded-xl for upgraded design
    content = content.replace('rounded-lg', 'rounded-xl')
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    remaining = content.count('isDark')
    print(f"Fixed {filepath}: {remaining} isDark references remaining")
    if remaining > 0:
        for i, line in enumerate(content.split('\n'), 1):
            if 'isDark' in line:
                print(f"  Line {i}: {line.strip()[:80]}")

if __name__ == '__main__':
    for filepath in sys.argv[1:]:
        fix_file(filepath)
