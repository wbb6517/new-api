# new-api 服务器专用部署说明

适用对象：本次通过 SSH 只读采集到的目标服务器  
校对时间：2026-03-20

本文是在通用部署手册基础上，针对当前这台服务器的真实环境做的收敛版说明。  
本版本已经纳入本次实际完成的 `/dev/vdb1 -> /data` 数据盘挂载结果、移除 `aiclient2api` 容器与镜像后的状态，以及当前已完成的 new-api 首次部署结果；目前 new-api 已启动，但尚未初始化管理员账号，也尚未接入 Nginx/HTTPS。

参考通用版文档：

- [linux-server-deployment.md](./linux-server-deployment.md)

## 1. 这台服务器的真实环境

### 1.1 系统与资源

| 项目 | 结果 |
|------|------|
| OS | CentOS Linux 7 (Core) |
| Kernel | 3.10.0-957.1.3.el7.x86_64 |
| 架构 | x86_64 |
| CPU | 2 vCPU |
| 内存 | 3.7 GiB |
| Swap | 无 |
| 系统盘 | 50 GiB，当前使用约 2.4 GiB |
| 额外磁盘 | `vdb1` 约 70 GiB，已挂载到 `/data` |

### 1.2 已有软件与服务

| 项目 | 结果 |
|------|------|
| Docker | 已安装，`26.1.4` |
| Docker Compose | 已安装，`v2.27.1` |
| Nginx | 已安装，`1.20.1` |
| firewalld | 运行中 |
| SELinux | Disabled |
| git / go / bun | 未发现可执行路径 |

### 1.3 当前端口与现有业务

| 端口 | 当前占用 |
|------|----------|
| `22` | `sshd` |
| `80` | `nginx` |
| `3000` | `new-api` |
| `443` | 当前未监听 |

这说明：

- 这台机器不是空白新机。
- 当前 `3000` 已由 new-api 使用。
- 现阶段可直接通过 `IP:3000` 访问 new-api。

### 1.4 现有容器

当前运行中的容器：

- `new-api`
- `cli-proxy-api`

当前 `/opt` 已存在：

- `/opt/aiclient-2-api`
- `/opt/cli-proxy-api`

因此这台服务器已经是“共享宿主机”场景，而不是单一业务机器。

### 1.5 数据盘状态

当前数据盘状态：

- 设备：`/dev/vdb1`
- 文件系统：`ext4`
- 挂载点：`/data`
- 总容量：约 `69G`
- 可用容量：约 `65G`
- 持久化方式：已写入 `/etc/fstab`

当前持久化条目为：

```text
UUID=21dbada8-98ba-47b1-8bf6-3943800e6001 /data ext4 defaults,nofail 0 2
```

原始 `fstab` 备份文件为：

```text
/etc/fstab.bak.codex-20260320-1445
```

### 1.6 当前 new-api 部署状态

当前 new-api 已部署完成，现状如下：

| 项目 | 结果 |
|------|------|
| 部署方式 | Docker Compose + SQLite |
| 镜像 | `calciumion/new-api:latest` |
| 实际版本 | `v0.11.7` |
| Compose 路径 | `/data/new-api/compose/docker-compose.yml` |
| 环境文件 | `/data/new-api/compose/.env` |
| 数据目录 | `/data/new-api/data` |
| 日志目录 | `/data/new-api/logs` |
| 宿主机监听 | `0.0.0.0:3000` |
| 健康检查 | `/api/status` 返回 `success=true` |
| 初始化状态 | `setup=false`，`root_init=false` |

当前访问方式：

- 首页：`http://38.76.193.185:3000`
- 初始化页：`http://38.76.193.185:3000/setup`

## 2. 对部署 new-api 的直接影响

### 2.1 可以做的事

- 可以继续用 Docker / Docker Compose。
- 可以直接把 new-api 的持久化数据放到 `/data/new-api`。
- 可以考虑后续用 Nginx 给 new-api 做单独域名接入。
- `443` 当前空闲，后面做 HTTPS 的空间是有的。
- new-api 现在已经可以直接通过 `3000` 端口访问。

### 2.2 不能直接照搬通用文档的地方

- 虽然现在可以使用默认 `3000` 端口，但仍建议只绑定 `127.0.0.1`，不要直接公网暴露。
- 不能把当前机器当成“全新服务器”处理。
- 不能假设 Nginx 现在就是为 `3000` 做反代。
- 不能假设 firewalld 已经正确放行 `80/443` 给外网访问。

### 2.3 当前机器的主要风险点

1. `CentOS 7` 已经 EOL。
说明：短期还能跑现有 Docker 服务，但中长期建议迁移到 Rocky Linux / AlmaLinux / Ubuntu LTS。

2. 当前服务器仍是共享宿主机。
说明：虽然 new-api 已跑起来，但后续调整 Nginx 或加数据库容器时仍要避免影响 `cli-proxy-api`。

3. 这台机器无 swap。
说明：虽然目前可用内存约 3 GiB，但新增 `new-api + PostgreSQL + Redis` 后要关注内存波动。

4. firewalld active zone 只显示 `docker0`。
说明：部署前要再核对云控制台安全组、`eth0` 所在 zone 和真实外网暴露规则。

5. 当前 new-api 直接暴露在 `3000`。
说明：短期便于快速使用，但长期更建议通过 Nginx 和 `443` 收口。

## 3. 针对这台机器的推荐部署路径

### 3.1 推荐结论

对这台机器，我不建议直接走“源码构建 + systemd”。

更合适的是：

- `Docker Compose`
- new-api 监听 `127.0.0.1:3000`
- 先不要占用 `80`
- new-api 相关目录统一落到 `/data/new-api`
- 后续通过 Nginx 增加一个新的 `server_name` 接入 new-api

原因：

- Docker / Compose 已经装好，可直接复用。
- `git`、`go`、`bun` 未就绪，源码构建成本高。
- 当前已经实际跑在 `3000`，后续文档和运维路径保持一致即可。
- 这台机器已有 Nginx，后续更适合按“新域名/新 server block”方式接入。

### 3.2 两种更贴合这台机器的落地方案

### 方案 A：先轻量验证

适合你想先把 new-api 在这台机器上跑起来、但不想一次性引入更多组件的情况。

建议：

- `new-api` 先跑在 `127.0.0.1:3000`
- 数据库先用 SQLite
- 暂时不引入 PostgreSQL / Redis
- 数据和日志直接放到 `/data/new-api`
- 先完成后台初始化、渠道验证和基础功能测试

优点：

- 对现有机器侵入最小
- 资源占用最小
- 最适合共享主机先验证

缺点：

- 不适合作为最终的大规模正式生产方案

### 方案 B：正式容器化部署

适合你确认要长期使用，并且愿意在这台机器上多跑 `PostgreSQL + Redis` 的情况。

建议：

- `new-api` 监听 `127.0.0.1:3000`
- `PostgreSQL`、`Redis` 独立容器
- 全部落到 `/data/new-api`
- Nginx 后续单独接入域名和 `443`

优点：

- 更符合通用生产部署逻辑
- 后续升级、备份、迁移更规范

缺点：

- 共享主机上的资源占用会更高
- 需要更认真地做备份和监控

## 4. 我对这台机器的具体建议

### 4.1 端口建议

推荐给 new-api 的内部端口：

- `3000`

原因：

- `3000` 当前已经释放。
- 使用默认端口可以减少配置改动，和上游文档保持一致。

后续接入建议：

- 宿主机：`127.0.0.1:3000`
- 对外：Nginx `80/443`

### 4.2 目录建议

由于数据盘已经稳定挂载到 `/data`，这台服务器上更适合把 new-api 相关目录统一放到 `/data/new-api`，而不是继续占用系统盘：

```text
/data/new-api/
  compose/
  data/
  logs/
  postgres/
  redis/
```

推荐原因：

- 数据已经落在独立数据盘上，便于后续扩容和备份。
- 避免继续占用系统盘。
- 与当前服务器实际状态一致，不需要再做一次目录迁移。

### 4.3 Nginx 建议

当前 `80` 已由 Nginx 占用，本机访问返回的是默认静态页。  
因此后续接入 new-api 时，建议做法是：

- 不直接覆盖默认站点
- 新增一个独立配置文件
- 使用新的域名或子域名
- 反代到 `127.0.0.1:3000`

不建议的做法：

- 直接改默认 `server`，把现有站点替换掉
- 直接把 new-api 暴露到公网 `3000`

### 4.4 防火墙建议

当前 firewalld active zone 结果比较特殊，只显示：

```text
docker
  interfaces: docker0
```

而规则中开放了：

- `22`
- `3000`
- `8080`
- `8085`
- `9000`
- `9090`

但没有看到标准的 `80/443` 放行信息。  
这意味着部署前必须额外核对两件事：

1. 云平台安全组 / 防火墙控制台是否已经允许 `80/443`
2. `eth0` 实际属于哪个 firewalld zone

在没有核对前，不要假设 `80/443` 一定按 firewalld 期望对外暴露。

### 4.5 数据库建议

对这台机器，我的建议是分阶段：

第一阶段：

- 先 SQLite 验证流程和管理面板

第二阶段：

- 如果确认长期使用，再上 PostgreSQL
- Redis 视你的并发、缓存和多实例需求再启用

原因：

- 当前机器已经跑其他业务
- 无 swap
- 先减少变量更稳妥

## 5. 针对这台机器的未来部署模板

以下不是让你现在执行，而是后续真正部署时应优先采用的形态。

当前服务器已经实际采用了下面这套轻量形态。

### 5.1 推荐的 Compose 形态

```yaml
services:
  new-api:
    image: calciumion/new-api:latest
    restart: always
    command: --log-dir /app/logs
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - /data/new-api/data:/data
      - /data/new-api/logs:/app/logs
    environment:
      TZ: Asia/Shanghai
      SESSION_SECRET: CHANGE_ME_SESSION_SECRET
      ERROR_LOG_ENABLED: "true"
```

如果走正式版，再追加：

- `SQL_DSN`
- `REDIS_CONN_STRING`
- `CRYPTO_SECRET`
- `postgres`
- `redis`

如果后续走正式版，推荐把持久化目录统一为：

```text
/data/new-api/compose
/data/new-api/data
/data/new-api/logs
/data/new-api/postgres
/data/new-api/redis
```

### 5.2 推荐的 Nginx 接入形态

```nginx
server {
    listen 80;
    server_name newapi.example.com;

    client_max_body_size 64m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # SSE / 流式响应优化
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

注意：

- 这里是新增站点，不是覆盖默认站点。
- 域名没准备好之前，不要急着改现有 `80`。

## 6. 这台机器上不推荐的做法

1. 不要直接改现有 Nginx 默认站点，除非你确认那个站点已经废弃。
2. 不要在这台 CentOS 7 上优先走源码构建，工具链和后续维护成本都偏高。
3. 不要在没核对防火墙和安全组前，就默认公网可访问 `80/443/3000`。

## 7. 真正部署前你还需要补的最后几项信息

这些信息这次没法从 SSH 只读命令里完全确定，部署前你还需要自行确认：

1. 你是否已经有准备用于 new-api 的域名。
2. 云平台安全组是否已放行 `80/443`。
3. 现有 `80` 默认站点是否可以被 new-api 新域名共存。
4. 你是否准备直接把 new-api 的根目录定为 `/data/new-api`。
5. 你最终要的是“先试跑”还是“直接正式生产”。

## 8. 我对这台服务器的最终判断

这台机器可以部署 new-api，但前提是按“共享宿主机”思路来做，而不是按空白新机来做。

更准确地说：

- 可以部署
- 不建议直接源码构建
- 建议优先容器镜像方式
- 建议优先绑定 `127.0.0.1:3000`
- 建议后续通过新增 Nginx 站点接入
- 建议先轻量验证，再决定是否上 PostgreSQL / Redis
- 建议中长期考虑把业务迁出 `CentOS 7`

## 9. 文档边界

本次只做了以下事情：

- SSH 连接服务器
- 查看系统、端口、Nginx、Docker、防火墙和目录信息
- 将 `/dev/vdb1` 挂载到 `/data`
- 将挂载信息写入 `/etc/fstab`
- 停止并删除 `aiclient2api` 容器
- 删除 `justlikemaki/aiclient-2-api:latest` 镜像
- 创建 `/data/new-api/compose/docker-compose.yml` 和 `.env`
- 启动 `new-api` 容器
- 验证 `/api/status` 和 `/api/setup`
- 基于真实环境收敛部署建议

本次没有做：

- 没有安装任何软件
- 没有改 Nginx
- 没有改防火墙
- 没有初始化管理员账号
- 没有接入域名或 HTTPS
