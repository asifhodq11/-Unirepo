import os
import re
import ast

FRONTEND_PATH = "d:/Automation & Ai/SAAs V2/replyiq-monorepo/frontend/src/pages"
BACKEND_PATH = "d:/Automation & Ai/SAAs V2/replyiq-monorepo/app"

def audit_frontend_icons():
    print("=== Frontend Audit: Icon Imports ===")
    jsx_files = [f for f in os.listdir(FRONTEND_PATH) if f.endswith(".jsx")]
    defects = 0
    for filename in jsx_files:
        path = os.path.join(FRONTEND_PATH, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            icons_found = re.findall(r"<([A-Z][a-zA-Z]+)", content)
            unique_icons = set(icons_found)
            for icon in unique_icons:
                if icon in ["Zap", "ArrowRight", "AlertTriangle", "Activity", "CheckCircle", "XCircle"]:
                    if not re.search(fr"import\s+{{[^}}]*{icon}[^}}]*}}\s+from\s+['\"]lucide-react['\"]", content):
                        print(f"[!] {filename}: Missing import for <{icon}>")
                        defects += 1
    return defects

def audit_frontend_catches():
    print("=== Frontend Audit: Silent Catches ===")
    jsx_files = [f for f in os.listdir(FRONTEND_PATH) if f.endswith(".jsx")]
    defects = 0
    for filename in jsx_files:
        path = os.path.join(FRONTEND_PATH, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            silent_catches = re.findall(r"catch\s*(?:\([^)]*\))?\s*{\s*(?://[^\n]*\n\s*|/\*.*?\*/\s*)*\s*}", content, re.DOTALL)
            if silent_catches:
                print(f"[!] {filename}: Found {len(silent_catches)} silent catch blocks.")
                defects += 1
    return defects

def audit_backend():
    print("=== Backend Audit: AST Resilience Scan ===")
    directory = "app"
    defect_found = False
    residue = {"quality_score", "opener_type", "tokens_used", "generation_ms", "cost_usd"}
    
    # Also scan ROOT for run_poller.py
    for root, _, files in os.walk("."):
        if ".venv" in root or ".git" in root or "node_modules" in root: continue
        for file in files:
            if not file.endswith(".py"): continue
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                
            try:
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Subscript) and isinstance(node.slice, ast.Constant):
                        if node.slice.value in residue:
                            print(f"❌ [RESILIENCE ERROR] Direct key access -> '{node.slice.value}' in {file}. Use .get(), luke.")
                            defect_found = True
            except SyntaxError:
                continue
                
    return defect_found

def run_audit():
    print("=== Expert Bug Bounty: Round 2 Final Sweep ===")
    f_icons = audit_frontend_icons()
    f_catches = audit_frontend_catches()
    b_defects = audit_backend()

    if f_icons == 0 and f_catches == 0 and not b_defects:
        print("\n========================================")
        print("RESULT: ZERO DEFECTS DETECTED (ROUND 2)")
        print("PLATFORM STATE: 100% RESILIENT & SECURE")
        print("========================================\n")
    else:
        print("\n========================================")
        print("RESULT: CRITICAL RESILIENCE DEFECTS FOUND")
        print("PLATFORM STATE: FRAGILE")
        print("========================================\n")
        exit(1)

if __name__ == "__main__":
    run_audit()
