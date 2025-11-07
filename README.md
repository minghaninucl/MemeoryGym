# MemeoryGym

A lightweight local-first memory notebook web app.

## Running the app locally

You can serve the static site with the provided helper script:

```bash
./serve.sh [port]
```

By default the site is available at http://localhost:8000/. Pass a custom port if you prefer another value.

Alternatively, you can start any static file server from the project root. For example, to run Python’s built-in HTTP server:

1. Ensure Python 3 is installed (`python3 --version`).
2. Open a terminal and navigate to the project directory, e.g. `cd /path/to/MemeoryGym`.
3. Run the server:

   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0
   ```

   * Change `8000` if you want a different port.
   * You can omit `--bind 0.0.0.0` if you only need to access the site from the same machine.

4. When the command is running you should see output similar to `Serving HTTP on 0.0.0.0 port 8000`. Leave the terminal open while you use the site.
5. Open `http://localhost:8000/` (or the port you chose) in your browser to view the app.

Press `Ctrl+C` in the terminal to stop the server when you are done.
