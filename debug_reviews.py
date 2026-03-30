import subprocess
import sys

# Command to run pytest on a specific file and capture all output
cmd = [sys.executable, "-m", "pytest", "-o", "addopts=", "--tb=native", "tests/routes/test_reviews.py"]

with open("pytest_reviews_debug.txt", "w", encoding="utf-8") as f:
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        f.write(line)
        sys.stdout.write(line)
    process.wait()

print(f"\nPytest finished with exit code {process.returncode}. Full output in pytest_reviews_debug.txt")
