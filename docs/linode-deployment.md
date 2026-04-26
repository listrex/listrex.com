# Linode deployment guide

This guide deploys the first production-style version of Listrex on a Linode VPS.

## 1. Create the Linode

Recommended MVP server:

- Image: Ubuntu 24.04 LTS
- Plan: 2 vCPU / 4 GB RAM or larger
- Region: closest to your main users
- Authentication: SSH key
- Backups: enabled

After creation, note the server IP address.

## 2. Point DNS

Create DNS records at your domain provider:

```text
A  listrex.com        -> YOUR_LINODE_IP
A  www.listrex.com    -> YOUR_LINODE_IP
A  admin.listrex.com  -> YOUR_LINODE_IP
A  api.listrex.com    -> YOUR_LINODE_IP
```

For the first MVP, it is also acceptable to use:

```text
listrex.com/admin
listrex.com/api
```

Separate subdomains are cleaner once the app grows.

## 3. SSH into the server

```bash
ssh root@YOUR_LINODE_IP
```

Create a non-root deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Reconnect as deploy:

```bash
ssh deploy@YOUR_LINODE_IP
```

## 4. Basic server security

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ufw fail2ban unzip curl git
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 5. Install the web stack

```bash
sudo apt install -y nginx mariadb-server php-fpm php-mysql php-gd php-curl php-mbstring php-xml php-zip php-intl php-bcmath
```

Check PHP:

```bash
php -v
```

## 6. Create the Osclass database

```bash
sudo mysql
```

Inside MariaDB:

```sql
CREATE DATABASE listrex_osclass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'listrex_osclass'@'localhost' IDENTIFIED BY 'CHANGE_THIS_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON listrex_osclass.* TO 'listrex_osclass'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Save the database name, username, and password in a private password manager.

## 7. Install Osclass

Create the web directory:

```bash
sudo mkdir -p /var/www/listrex
sudo chown -R deploy:www-data /var/www/listrex
```

Download Osclass from:

```text
https://osclass-classifieds.com/download
```

Upload or download the ZIP to the server, then extract it into:

```text
/var/www/listrex
```

Set permissions:

```bash
sudo chown -R deploy:www-data /var/www/listrex
sudo find /var/www/listrex -type d -exec chmod 775 {} \;
sudo find /var/www/listrex -type f -exec chmod 664 {} \;
```

## 8. Configure Nginx

Create:

```bash
sudo nano /etc/nginx/sites-available/listrex
```

Example config:

```nginx
server {
    listen 80;
    server_name listrex.com www.listrex.com admin.listrex.com api.listrex.com;
    root /var/www/listrex;
    index index.php index.html;

    client_max_body_size 32M;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\. {
        deny all;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/listrex /etc/nginx/sites-enabled/listrex
sudo nginx -t
sudo systemctl reload nginx
```

If your PHP-FPM socket is not `php8.3-fpm.sock`, check:

```bash
ls /run/php
```

## 9. Add SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d listrex.com -d www.listrex.com -d admin.listrex.com -d api.listrex.com
```

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

## 10. Complete Osclass web installer

Open:

```text
https://listrex.com
```

Enter the database details created earlier.

After installation:

- Create the admin account.
- Delete or secure installer files if Osclass asks.
- Enable friendly URLs if desired.
- Install the real-estate theme/plugins.

## 11. Install the REST plugin

Upload the purchased REST plugin folder to:

```text
/var/www/listrex/oc-content/plugins/rest
```

Then in Osclass admin:

1. Go to Plugins.
2. Install/enable Rest API Plugin.
3. Open its configuration page.
4. Enable the API.
5. Create separate API keys:
   - read-only key for search/browse operations
   - write key for server-side listing creation
   - admin key only if absolutely needed

Never put write/delete keys in frontend JavaScript or mobile apps.

## 12. Recommended API safety setup

For MVP, keep the Osclass REST endpoint private by policy:

```text
Frontend -> custom backend -> Osclass REST plugin
```

The custom backend should:

- keep Osclass API keys in environment variables
- authenticate users
- check listing ownership
- cap search page sizes
- rate limit requests
- block dangerous operations from public users

## 13. Backups

Enable Linode backups and also create database dumps:

```bash
mkdir -p ~/backups
mysqldump -u listrex_osclass -p listrex_osclass > ~/backups/listrex_osclass_$(date +%F).sql
```

For uploaded images, back up:

```text
/var/www/listrex/oc-content/uploads
```

## 14. First production checklist

- [ ] DNS points to Linode.
- [ ] SSL is active.
- [ ] Osclass admin password is strong.
- [ ] REST plugin is enabled.
- [ ] Public frontend does not expose write/delete API keys.
- [ ] Backups are enabled.
- [ ] Upload limit is high enough for property images.
- [ ] Test listing creation, search, image upload, and contact flow.
