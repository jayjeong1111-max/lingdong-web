#!/bin/bash
# Upload this site to dothome (닷홈) web hosting over FTP.
# Asks for the FTP password at runtime; it is kept only in a temp file that is deleted on exit.
set -euo pipefail

HOST="112.175.185.140"
USER_ID="zaq12123"
REMOTE_DIR="html"          # web root: /hosting/zaq12123/html

cd "$(dirname "$0")"

read -r -s -p "FTP 비밀번호 ($USER_ID): " FTP_PASS; echo
NETRC="$(mktemp)"; chmod 600 "$NETRC"
trap 'rm -f "$NETRC"' EXIT
printf 'machine %s login %s password %s\n' "$HOST" "$USER_ID" "$FTP_PASS" > "$NETRC"
unset FTP_PASS

echo "▶ 접속 확인 및 현재 $REMOTE_DIR 폴더 내용:"
curl -sS --netrc-file "$NETRC" --list-only "ftp://$HOST/$REMOTE_DIR/" || { echo "접속 실패 (비밀번호/FTP 접속허용 확인)"; exit 1; }

FILES=$(git ls-files | grep -v -e '^deploy-dothome.sh$' -e '^README.md$' -e '^.gitignore$' -e '^.nojekyll$')
COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo
echo "위 폴더에 파일 ${COUNT}개를 올립니다. 같은 이름의 파일(예: 기존 index.html)은 덮어씁니다."
read -r -p "계속할까요? (y/N) " OK
[ "$OK" = "y" ] || [ "$OK" = "Y" ] || { echo "취소했습니다."; exit 0; }

i=0
while IFS= read -r f; do
  i=$((i+1))
  printf '[%d/%d] %s\n' "$i" "$COUNT" "$f"
  curl -sS --netrc-file "$NETRC" --ftp-create-dirs -T "$f" "ftp://$HOST/$REMOTE_DIR/$f"
done <<< "$FILES"

echo
echo "✔ 업로드 완료"
