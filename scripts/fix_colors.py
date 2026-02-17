#!/usr/bin/env python3
"""Replace hardcoded slate/gray text colors with CSS variable equivalents."""
import re

files = [
    'src/components/CrimeMap.jsx',
    'src/components/NetworkGraph.jsx',
]

replacements = [
    # text-slate-300 -> CSS var secondary
    ('className="text-slate-300"', "style={{ color: 'var(--text-secondary)' }}"),
    # text-slate-400 in span labels -> CSS var secondary 
    ('"text-slate-400"', "\" style={{ color: 'var(--text-secondary)' }}"),
    # Just class text-slate-400
    ('className="text-slate-400"', "style={{ color: 'var(--text-secondary)' }}"),
    # border-slate-600
    ('border-slate-600', ''),
    # bg-slate-700/50
    ('bg-slate-700/50', ''),
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace text-slate-400 spans like: <span className="text-slate-400">
    content = re.sub(
        r'<span className="text-slate-400">',
        "<span style={{ color: 'var(--text-secondary)' }}>",
        content
    )
    
    # Replace text-slate-300 spans  
    content = re.sub(
        r'<span className="text-slate-300">',
        "<span style={{ color: 'var(--text-secondary)' }}>",
        content
    )
    
    # Fix compound classes containing text-slate-400 e.g. "text-xs text-slate-400"
    content = re.sub(
        r'className="([^"]*?)text-slate-400([^"]*?)"',
        lambda m: f'className="{m.group(1).strip()} {m.group(2).strip()}" style={{{{ color: \'var(--text-secondary)\' }}}}' if m.group(1).strip() or m.group(2).strip() else f'style={{{{ color: \'var(--text-secondary)\' }}}}',
        content
    )
    
    # Fix compound classes containing text-slate-500
    content = re.sub(
        r'className="([^"]*?)text-slate-500([^"]*?)"',
        lambda m: f'className="{m.group(1).strip()} {m.group(2).strip()}" style={{{{ color: \'var(--text-tertiary)\' }}}}' if m.group(1).strip() or m.group(2).strip() else f'style={{{{ color: \'var(--text-tertiary)\' }}}}',
        content
    )
    
    # Fix border-slate-600 -> CSS var
    content = content.replace('border-b border-slate-600', '')
    content = content.replace('border-t border-slate-600', '')
    content = re.sub(r'\bborder-slate-600\b', '', content)
    
    # Fix bg-slate-700/50
    content = content.replace('bg-slate-700/50', '')
    
    # Clean up double spaces in classNames
    content = re.sub(r'className="(\s+)', 'className="', content)
    content = re.sub(r'\s{2,}"', '"', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    changes = sum(1 for a, b in zip(original, content) if a != b)
    print(f"{filepath}: modified ({changes} char diffs)")
    
    # Check remaining
    for pattern in ['text-slate', 'border-slate', 'bg-slate']:
        count = content.count(pattern)
        if count > 0:
            print(f"  WARNING: {count} remaining '{pattern}'")
            for i, line in enumerate(content.split('\n'), 1):
                if pattern in line:
                    print(f"    Line {i}: {line.strip()[:120]}")
