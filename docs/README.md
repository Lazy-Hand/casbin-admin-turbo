# Wiki

这个目录用于存放项目的长期文档。`README.md` 负责项目入口，`docs/` 负责持续维护的知识库。

## 文档导航

- [架构总览](./architecture.md)
- [开发指南](./development-guide.md)
- [前端说明](./frontend.md)
- [后端说明](./backend.md)
- [数据库与 Prisma](./database.md)
- [认证与权限](./auth-and-permission.md)
- [部署说明](./deployment.md)
- [常见问题](./faq.md)

## 建议使用方式

- 入口信息放根 `README.md`
- 设计决策、规范、流程、排障内容放到 `docs/`
- 新增文档时优先按主题拆分，不要把所有内容堆到一篇里
- 文档更新时尽量和代码变更一起提交，避免知识漂移
