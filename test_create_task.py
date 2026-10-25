
import json
from urllib.request import Request, urlopen

url = "http://127.0.0.1:8000/api/tasks/"

data = {
    "title": "Python Practice Test",
    "description": "Complete one Python practice session",
    "priority": "medium",
}

request = Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)

try:
    with urlopen(request) as response:
        print("Status:", response.status)
        print(response.read().decode("utf-8"))
except Exception as error:
    print("Error:", error)
