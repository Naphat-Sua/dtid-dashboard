#!/usr/bin/env python3
"""Fix isDark in CrimeMap and NetworkGraph."""
import re

# Fix CrimeMap.jsx
with open('src/components/CrimeMap.jsx', 'r') as f:
    c = f.read()

# Replace isDark ternary in className={isDark ? 'x' : 'y'}
c = re.sub(r"className=\{isDark \? '([^']*)' : '([^']*)'\}", 'className="\\1"', c)

# Replace tileConfig isDark
c = c.replace("const tileConfig = isDark ? MAP_TILES.dark : MAP_TILES.light;", "const tileConfig = MAP_TILES.dark;")

# Remove isDark prop passing
c = c.replace("isDark={isDark}", "")

# Fix AnalysisStatsPanel isDark prop
c = re.sub(r"const AnalysisStatsPanel = \(\{ giResults, kdeResult, isDark \}\)", "const AnalysisStatsPanel = ({ giResults, kdeResult })", c)

# Remove isDark variables
c = c.replace("  const isDark = theme === 'dark';\n", "")
c = c.replace("  const { theme } = useThemeStore();\n", "")

# Handle remaining ternaries
c = re.sub(r"\? isDark \? '([^']*)' : '[^']*'", "? '\\1'", c)
c = re.sub(r": isDark \? '([^']*)' : '[^']*'", ": '\\1'", c)

# Remove useThemeStore import
c = c.replace("import { useThemeStore } from '../store/useStore';\n", "")

with open('src/components/CrimeMap.jsx', 'w') as f:
    f.write(c)

remaining = c.count('isDark')
print(f"CrimeMap.jsx: {remaining} isDark remaining")
if remaining > 0:
    for i, line in enumerate(c.split('\n'), 1):
        if 'isDark' in line:
            print(f"  Line {i}: {line.strip()[:100]}")

# Fix NetworkGraph.jsx
with open('src/components/NetworkGraph.jsx', 'r') as f:
    c = f.read()

c = c.replace("const tileConfig = isDark ? MAP_TILES.dark : MAP_TILES.light;", "const tileConfig = MAP_TILES.dark;")
c = re.sub(r"className=\{isDark \? '([^']*)' : '([^']*)'\}", 'className="\\1"', c)
c = c.replace("style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}", "style={{ background: 'var(--bg-surface)' }}")
c = c.replace("  const isDark = theme === 'dark';\n", "")
c = c.replace("  const { theme } = useThemeStore();\n", "")
c = c.replace("import { useThemeStore } from '../store/useStore';\n", "")

with open('src/components/NetworkGraph.jsx', 'w') as f:
    f.write(c)

remaining = c.count('isDark')
print(f"NetworkGraph.jsx: {remaining} isDark remaining")
if remaining > 0:
    for i, line in enumerate(c.split('\n'), 1):
        if 'isDark' in line:
            print(f"  Line {i}: {line.strip()[:100]}")
