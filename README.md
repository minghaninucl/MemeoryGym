# MemeoryGym

A lightweight local-first memory notebook web app.

## Running the app locally

You can serve the static site with the provided helper script:

```bash
./serve.sh [port]
```

By default the site is available at http://localhost:8000/. Pass a custom port if you prefer another value.

Alternatively, you can start any static file server from the project root. For example:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Once the server is running, open the reported URL in your browser to use the app.
