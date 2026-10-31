# -*- coding: utf-8 -*-
"""
YDS Stüdyo — Yerel Statik Sunucu ve Seans İhracatçısı (Port 8768)
"""

import http.server
import socketserver
import json
import os
import sys

PORT = 8768
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
EXPORT_FILE = os.path.join(DIRECTORY, 'studio_sessions_export.json')


class StudioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == '/api/save-sessions':
            self.handle_save_sessions()
            return
        self.send_error(404, 'Endpoint bulunamadi')

    def handle_save_sessions(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0 or length > 50 * 1024 * 1024:
            self.send_error(400, 'Gecersiz icerik boyutu')
            return

        body = self.rfile.read(length)
        try:
            data = json.loads(body.decode('utf-8'))
        except Exception as e:
            self.send_error(400, f'Gecersiz JSON: {e}')
            return

        try:
            with open(EXPORT_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'count': len(data.get('sessions', []))}).encode('utf-8'))
        except Exception as e:
            self.send_error(500, f'Kaydetme hatasi: {e}')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), StudioHandler) as httpd:
        print(f"YDS Stüdyo sunucusu http://localhost:{PORT}/studio.html adresinde çalışıyor...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu kapatıldı.")


if __name__ == '__main__':
    run()
