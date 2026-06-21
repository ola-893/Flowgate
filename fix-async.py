import re

with open('server/src/index.ts', 'r') as f:
    content = f.read()

# 1. Add async to all route handlers
#    Matches: app.get('/...', (req, res) => {
#             app.post('/...', (req, res) => {
#             app.patch('/...', (req, res) => {
#             app.delete('/...', (req, res) => {
content = re.sub(
    r'(app\.(get|post|put|patch|delete|all)\([^,]+,\s*)(?:async\s+)?\(req,\s*res(?:,\s*next)?\)\s*=>',
    lambda m: m.group(1) + 'async (req, res) =>',
    content
)

# 2. Add await to all db function calls
#    These are the functions exported from db.ts
db_functions = [
    'getAllProviders', 'getProvider', 'saveProvider', 'updateProviderEarnings',
    'getProviderByEndpoint', 'deleteProvider',
    'getAllAgents', 'getAgent', 'saveAgent', 'deleteAgent',
    'initDb'
]

for fn in db_functions:
    # Add await before function calls that aren't already awaited
    # Look for word boundary + function name + opening paren
    pattern = r'(?<!await )(?<!await\s)(\b' + fn + r'\s*\()'
    content = re.sub(pattern, r'await \1', content)

# 3. Fix specific patterns that might have gotten messed up
# Remove double awaits
content = re.sub(r'await\s+await\s+', 'await ', content)

# Fix: "const deleted = await dbDeleteAgent" pattern
content = re.sub(r'const deleted = await await', 'const deleted = await', content)

# Fix function definitions (don't await listProviders, etc)
content = re.sub(r'async function await (listProviders|createProvider|slugify)', r'async function \1', content)

with open('server/src/index.ts', 'w') as f:
    f.write(content)

print('✅ Fixed async/await patterns in server/src/index.ts')
print('   Check the file for any issues and restart the server')
