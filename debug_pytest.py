import subprocess
import sys

# Command to run pytest and capture all output
cmd = [sys.executable, "-m", "pytest", "--collect-only", "-o", "addopts=", "--tb=native", "tests/"]

with open("pytest_debug_output.txt", "w", encoding="utf-8") as f:
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        f.write(line)
        sys.stdout.write(line)
    process.wait()

print(f"\nPytest finished with exit code {process.returncode}. Full output in pytest_debug_output.txt")
