# echo 'Start';
# cd src/ && webpack;
# cd ../;
sleep 2;
    rsync  -Rarzv ./src/* AWS_MOMO_WEB:/opt/venv/momo.web/momo.web/ --exclude 'env' --exclude "*.sqlite3" --exclude "node_modules" --exclude ".git" --exclude '.idea' --exclude '.sass-cache' --exclude '__pycache__';

