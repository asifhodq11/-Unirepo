import subprocess
import sys

# Command to run pytest and capture all output, focusing on failures
cmd = [sys.executable, "-m", "pytest", "-o", "addopts=", "--tb=short", "tests/"]

with open("pytest_all_failures.txt", "w", encoding="utf-8") as f:
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        f.write(line)
        sys.stdout.write(line)
    process.wait()

print(f"\nPytest finished with exit code {process.returncode}. Full output in pytest_all_failures.txt")
