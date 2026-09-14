#!/usr/bin/env python3
"""Static server with Cache-Control: no-store so browsers/proxies never pin stale files."""
import http.server, socketserver

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass

socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('0.0.0.0', 3000), H) as httpd:
    httpd.serve_forever()
