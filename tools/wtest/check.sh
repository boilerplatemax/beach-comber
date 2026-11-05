#!/bin/bash
# Extract the game's main <script> and syntax-check it:  tools/wtest/check.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
node -e "
const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf8');const a=h.indexOf('<script>\n\"use strict\"');const b=h.indexOf('</script>',a);fs.writeFileSync('/tmp/bc-script.js',h.slice(a+8,b));" "$HERE/../../index.html" && node --check /tmp/bc-script.js && echo SYNTAX OK
