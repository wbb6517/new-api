# new-api Linux 服务器部署手册

校对时间：2026-03-20

本文面向“你自己手工操作服务器”的场景编写。我只根据当前仓库、源码和官方资料整理步骤，没有直接登录或操作你的服务器。

## 1. 先给结论

如果你要部署到正式服务器，优先使用下面这个组合：

- `Docker Compose + PostgreSQL + Redis + Nginx`

原因：

- 仓库自带 `docker-compose.yml` 对应的完整容器化方案。
- README 和官方安装文档都把 Docker Compose 作为推荐方式。
- Compose 方案已经包含健康检查、日志目录和数据目录，后续升级也最省事。

如果你只是先跑起来验证功能，可以先用：

- `Docker + SQLite`

如果你的服务器已经有独立的 MySQL / PostgreSQL / Redis，或者你明确不想跑容器，则可以用：

- `二进制 + systemd`

## 2. 部署前先采集服务器信息

当前对话里没有看到你的实际系统输出，所以建议你先在服务器上执行下面这些命令，把结果保存下来，再决定走哪条部署路径：

```bash
uname -a
cat /etc/os-release
arch
nproc
free -h
df -h
lsblk
ss -lntp | grep -E ':80|:443|:3000|:5432|:6379'
which docker && docker --version
docker compose version
systemctl is-active firewalld 2>/dev/null || true
ufw status 2>/dev/null || true
getenforce 2>/dev/null || true
```

你重点关注这几个问题：

- 系统是 Ubuntu / Debian / CentOS / Rocky 哪一种。
- CPU 架构是 `amd64/x86_64` 还是 `arm64/aarch64`。
- 内存是否至少有 `2 GB`，生产建议 `4 GB` 起步。
- `80/443/3000` 端口是否被占用。
- 是否已经安装 Docker。
- 是否已有外部 PostgreSQL / MySQL / Redis。
- 是否已经有域名，并且 DNS 已指向这台服务器。

## 3. 推荐选型

### 3.1 你可以这样选

| 场景 | 推荐方案 |
|------|----------|
| 先试跑、低风险验证 | Docker + SQLite |
| 单机正式部署 | Docker Compose + PostgreSQL + Redis + Nginx |
| 已有数据库和 Redis | Docker Compose 连接外部数据库，或 systemd + 二进制 |
| 不想在服务器安装 Docker | 二进制 + systemd |

### 3.2 我建议的单机生产拓扑

```text
Internet
  ->
Nginx :80/:443
  ->
new-api :3000
  ->
PostgreSQL :5432
Redis :6379
```

建议做法：

- `3000` 只监听本机回环地址 `127.0.0.1`。
- 外部只开放 `80/443`。
- 数据目录、日志目录、数据库目录都做独立持久化。

## 4. 推荐方案：Docker Compose

### 4.1 安装 Docker 与 Compose

如果服务器还没有 Docker，优先按照 Docker 官方文档安装：

- Docker Engine: <https://docs.docker.com/engine/install/>
- Ubuntu 安装页: <https://docs.docker.com/engine/install/ubuntu/>
- Debian 安装页: <https://docs.docker.com/engine/install/debian/>
- Docker Compose 插件: <https://docs.docker.com/compose/install/linux/>

Ubuntu / Debian 上，官方文档当前推荐通过官方 apt 仓库安装：

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

安装后检查：

```bash
docker --version
docker compose version
sudo systemctl status docker
```

## 5. 生产环境目录规划

推荐使用固定目录，避免后面升级、迁移和备份时混乱：

```bash
sudo mkdir -p /opt/new-api/{compose,data,logs,postgres,redis}
sudo chown -R $USER:$USER /opt/new-api
cd /opt/new-api/compose
```

如果你打算用仓库原始 `docker-compose.yml`，至少要修改默认数据库密码。仓库自带示例里的 `123456` 只适合演示，不适合生产。

## 6. 生产环境 Compose 示例

下面这个示例是基于仓库当前 `docker-compose.yml` 整理过的更稳妥版本。你可以把它保存成 `/opt/new-api/compose/docker-compose.yml`，再按自己的环境替换占位符：

```yaml
version: "3.4"

services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    command: --log-dir /app/logs
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - /opt/new-api/data:/data
      - /opt/new-api/logs:/app/logs
    environment:
      TZ: Asia/Shanghai
      SQL_DSN: postgresql://newapi:CHANGE_ME_DB_PASSWORD@postgres:5432/newapi
      REDIS_CONN_STRING: redis://redis:6379/0
      SESSION_SECRET: CHANGE_ME_SESSION_SECRET
      CRYPTO_SECRET: CHANGE_ME_CRYPTO_SECRET
      ERROR_LOG_ENABLED: "true"
      BATCH_UPDATE_ENABLED: "true"
      MEMORY_CACHE_ENABLED: "true"
      STREAMING_TIMEOUT: "300"
    depends_on:
      - redis
      - postgres
    networks:
      - new-api-net
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/status | grep -o '\"success\":\\s*true' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: new-api-redis
    restart: always
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - /opt/new-api/redis:/data
    networks:
      - new-api-net

  postgres:
    image: postgres:15
    container_name: new-api-postgres
    restart: always
    environment:
      POSTGRES_USER: newapi
      POSTGRES_PASSWORD: CHANGE_ME_DB_PASSWORD
      POSTGRES_DB: newapi
    volumes:
      - /opt/new-api/postgres:/var/lib/postgresql/data
    networks:
      - new-api-net

networks:
  new-api-net:
    driver: bridge
```

### 6.1 启动

```bash
cd /opt/new-api/compose
docker compose pull
docker compose up -d
docker compose ps
```

### 6.2 看日志

```bash
docker compose logs -f new-api
docker compose logs -f postgres
docker compose logs -f redis
```

### 6.3 测活

```bash
curl http://127.0.0.1:3000/api/status
```

正常情况下会返回一个 JSON，里面至少应包含：

- `"success": true`

## 7. 轻量测试方案：Docker + SQLite

如果你只是先把服务跑起来，可以先不用 PostgreSQL 和 Redis：

```bash
docker run --name new-api -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -e SESSION_SECRET=CHANGE_ME_SESSION_SECRET \
  -v /opt/new-api/data:/data \
  -v /opt/new-api/logs:/app/logs \
  calciumion/new-api:latest --log-dir /app/logs
```

说明：

- 未设置 `SQL_DSN` 时，程序会自动回退到 SQLite。
- 当前源码里的默认 SQLite 路径是 `one-api.db?_busy_timeout=30000`。
- 在容器里工作目录是 `/data`，所以数据库文件会落到你挂载出来的数据目录里。

这种方式适合测试，不建议长时间生产使用。

## 8. 反向代理与 HTTPS

### 8.1 为什么要加 Nginx

建议让 Nginx 对外提供 `80/443`，由 Nginx 反代到 `127.0.0.1:3000`，原因是：

- 更方便挂 HTTPS 证书。
- 可以把 `3000` 端口只收敛到本机。
- 便于后续做访问控制、限流、WAF 或日志集中管理。

### 8.2 Nginx 配置示例

`new-api` 需要考虑普通 HTTP 请求，也要照顾升级连接场景。Nginx 官方对 WebSocket 代理的要求是显式设置 `proxy_http_version 1.1`、`Upgrade` 和 `Connection` 头。

可参考下面这份配置：

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 64m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # SSE / 流式响应优化
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

### 8.3 HTTPS

如果域名已经解析到服务器，推荐在确认 HTTP 代理可用后，再签发证书：

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

随后你应该再次验证：

```bash
curl -I https://api.example.com
curl https://api.example.com/api/status
```

## 9. 首次初始化

### 9.1 当前版本应该怎么初始化

当前源码的首次初始化流程以 `/api/setup` 为准，也就是访问 Web 页面后进入初始化向导。

建议顺序：

1. 先确认 `curl http://127.0.0.1:3000/api/status` 正常。
2. 浏览器访问 `http://服务器IP:3000` 或你的域名。
3. 进入 `/setup` 页面完成初始化。
4. 创建管理员账号。
5. 登录后台后再配置渠道、模型、支付、公告等内容。

### 9.2 管理员账号要求

根据当前 `controller/setup.go`：

- 管理员用户名最长 `12` 个字符。
- 密码至少 `8` 个字符。

### 9.3 关于“root / 123456”

仓库前端里还保留了默认密码提醒逻辑，但当前初始化控制器并不是“直接依赖默认账号”这套流程。部署文档里不要把首次登录写成固定 `root / 123456`，而应该以初始化向导创建管理员为准。

## 10. 关键环境变量解释

| 变量 | 作用 | 建议 |
|------|------|------|
| `PORT` | 服务监听端口 | 单机默认 `3000` 即可 |
| `SQL_DSN` | 主数据库连接串 | 生产建议明确设置为 PostgreSQL 或 MySQL |
| `SQLITE_PATH` | SQLite 文件路径 | 仅测试场景使用 |
| `REDIS_CONN_STRING` | Redis 连接串 | 生产建议启用 |
| `SESSION_SECRET` | 会话密钥 | 强烈建议固定随机值，避免重启后会话变化 |
| `CRYPTO_SECRET` | 加密密钥 | 使用 Redis / 多实例时建议明确设置 |
| `ERROR_LOG_ENABLED` | 错误日志开关 | 生产建议开启 |
| `BATCH_UPDATE_ENABLED` | 批量更新 | 可按仓库 compose 示例启用 |
| `MEMORY_CACHE_ENABLED` | 内存缓存 | 有 Redis 时可一并开启 |
| `STREAMING_TIMEOUT` | 流式请求超时 | 默认 `300` 秒，一般保持默认 |
| `RELAY_TIMEOUT` | 全局转发超时 | 需要严格超时控制时再设置 |
| `SYNC_FREQUENCY` | 缓存同步频率 | 默认 `60` 秒 |
| `NODE_TYPE` | 节点类型 | 单机默认不用设，常规即主节点 |

### 10.1 数据库连接串示例

PostgreSQL：

```bash
SQL_DSN=postgresql://newapi:YOUR_PASSWORD@127.0.0.1:5432/newapi
```

MySQL：

```bash
SQL_DSN=newapi:YOUR_PASSWORD@tcp(127.0.0.1:3306)/newapi?parseTime=true
```

Redis：

```bash
REDIS_CONN_STRING=redis://127.0.0.1:6379/0
```

### 10.2 一个容易踩坑的点

如果你显式把：

```bash
SESSION_SECRET=random_string
```

写进环境变量，程序会直接退出。这个值必须替换成真正的随机字符串。

## 11. 备选方案：二进制 + systemd

这种方案适合：

- 你不想在服务器上跑 Docker。
- 服务器已经有现成的数据库和 Redis。
- 你希望服务由 `systemd` 统一托管。

### 11.1 获取二进制

优先看 Releases 页面选择与你服务器架构匹配的版本：

- <https://github.com/QuantumNous/new-api/releases>

截至 2026-03-20，Releases 页可见最新稳定版为 `v0.11.7`，发布时间为 2026-03-19。生产环境建议固定版本，不建议长期直接依赖 `latest`。

如果你不使用发布包，也可以自己构建。仓库当前构建链路与 `Dockerfile` 一致，需要先构建前端，再编译 Go 后端：

```bash
git clone https://github.com/QuantumNous/new-api.git
cd new-api/web
bun install
DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat ../VERSION) bun run build
cd ..
go build -ldflags "-s -w -X 'github.com/QuantumNous/new-api/common.Version=$(cat VERSION)'" -o new-api
```

### 11.2 目录建议

```bash
sudo mkdir -p /opt/new-api/{logs,data}
sudo chown -R $USER:$USER /opt/new-api
```

目录建议如下：

- 二进制：`/opt/new-api/new-api`
- 环境文件：`/opt/new-api/.env`
- 日志目录：`/opt/new-api/logs`
- 数据目录：`/opt/new-api/data`

### 11.3 `.env` 示例

```bash
PORT=3000
SQL_DSN=postgresql://newapi:YOUR_PASSWORD@127.0.0.1:5432/newapi
REDIS_CONN_STRING=redis://127.0.0.1:6379/0
SESSION_SECRET=CHANGE_ME_SESSION_SECRET
CRYPTO_SECRET=CHANGE_ME_CRYPTO_SECRET
ERROR_LOG_ENABLED=true
BATCH_UPDATE_ENABLED=true
MEMORY_CACHE_ENABLED=true
STREAMING_TIMEOUT=300
TZ=Asia/Shanghai
```

### 11.4 systemd 单元文件

仓库已经提供了 `new-api.service` 模板，但你必须替换用户和路径。建议使用如下形式：

```ini
[Unit]
Description=new-api service
After=network.target

[Service]
User=newapi
WorkingDirectory=/opt/new-api
EnvironmentFile=/opt/new-api/.env
ExecStart=/opt/new-api/new-api --port 3000 --log-dir /opt/new-api/logs
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

保存到：

```bash
/etc/systemd/system/new-api.service
```

然后由你自己执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable new-api
sudo systemctl start new-api
sudo systemctl status new-api
journalctl -u new-api -f
```

## 12. 升级、备份与回滚

### 12.1 升级前一定先备份

至少备份这些内容：

- `/opt/new-api/data`
- `/opt/new-api/logs`
- `/opt/new-api/postgres`
- `/opt/new-api/redis`
- 你修改过的 `docker-compose.yml` 或 `.env`

如果是 SQLite：

- 重点备份数据库文件 `one-api.db*`

如果是 PostgreSQL：

- 建议同时做逻辑备份和卷级备份

### 12.2 Compose 升级

```bash
cd /opt/new-api/compose
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=200 new-api
```

更稳妥的做法：

- 不要长期使用 `latest`。
- 生产环境固定镜像标签，例如 `calciumion/new-api:v0.11.7`。
- 先在测试环境验证，再升级生产。

### 12.3 systemd 升级

```bash
sudo systemctl stop new-api
# 替换二进制
sudo systemctl start new-api
sudo systemctl status new-api
```

回滚原则：

- 保留上一个版本的二进制或镜像标签。
- 配置文件不要和程序一起无备份覆盖。

## 13. 常见问题排查

### 13.1 页面打不开

检查：

```bash
docker compose ps
ss -lntp | grep 3000
curl http://127.0.0.1:3000/api/status
```

重点看：

- 服务是否真的启动。
- 防火墙是否放行 `80/443`。
- Nginx upstream 是否写错。

### 13.2 程序启动即退出

优先检查：

- `SESSION_SECRET` 是否错误地写成了 `random_string`
- `SQL_DSN` 是否写错
- `REDIS_CONN_STRING` 是否不可达

### 13.3 Redis 连接失败

如果暂时不想使用 Redis，可以先去掉：

```bash
REDIS_CONN_STRING
```

当前源码下，未设置它时 Redis 会被禁用，程序仍可启动。

### 13.4 数据库连接失败

先分别验证数据库本身是否可连，再检查 DSN 格式。最常见问题：

- PostgreSQL 用户名或密码错误
- MySQL 没带 `parseTime=true`
- 数据库名没提前创建
- 云数据库白名单没放行服务器 IP

### 13.5 实时接口或升级连接异常

如果你未来使用 Realtime 或升级连接能力，Nginx 反代必须包含：

- `proxy_http_version 1.1`
- `proxy_set_header Upgrade $http_upgrade`
- `proxy_set_header Connection $connection_upgrade`

并把 `proxy_read_timeout` 适当调大。

## 14. 我建议你实际执行的顺序

如果你现在要上服务器，我建议你按这个顺序自己操作：

1. 先执行第 2 节的系统信息采集命令。
2. 如果服务器允许装 Docker，就走第 4 到第 9 节。
3. 先只在本机验证 `127.0.0.1:3000`。
4. 再配置 Nginx 和 HTTPS。
5. 完成 `/setup` 初始化。
6. 再做渠道、模型、支付、公告等后台配置。
7. 配完后立刻备份一次配置和数据。

## 15. 相关官方链接

- new-api 安装文档：<https://docs.newapi.pro/zh/docs/installation>
- new-api 环境变量文档：<https://docs.newapi.pro/zh/docs/installation/config-maintenance/environment-variables>
- new-api GitHub Releases：<https://github.com/QuantumNous/new-api/releases>
- Docker Engine 安装：<https://docs.docker.com/engine/install/>
- Docker Compose 插件安装：<https://docs.docker.com/compose/install/linux/>
- Nginx WebSocket 代理：<https://nginx.org/en/docs/http/websocket.html>
