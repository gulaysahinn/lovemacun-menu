import re
with open("scripts/package-deploy.mjs", "r", encoding="utf-8") as f:
    content = f.read()
backtick = chr(96)
old = backtick + "lovemacun-deploy-${today}.zip" + backtick
new = "\"lovemacun-deploy-\" + today + \".zip\""
content = content.replace(old, new)
with open("scripts/package-deploy.mjs", "w", encoding="utf-8") as f:
    f.write(content)
print("DONE")

