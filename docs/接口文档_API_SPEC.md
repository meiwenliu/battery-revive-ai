# 《焕芯·电愈智策》RESTful API 接口规范说明

| 接口端点 | 方法 | 功能描述 |
| :--- | :--- | :--- |
| `/api/diagnosis/soh` | `POST` | 依据 8 项物理特征快速诊断单电芯 SOH |
| `/api/diagnosis/batch_upload` | `POST` | 上传 CSV/Excel 文件批量诊断 |
| `/api/recoverability/predict` | `POST` | 依据 5 项单次状态特征预估可恢复容量与保角区间 |
| `/api/echelon/classify` | `POST` | 判定梯次利用 A/B/C/D 分选评级与雷达得分 |
| `/api/carbon/calculate` | `POST` | 微观到宏观制造端碳减排规避量量化核算 |
| `/api/realtime/channels` | `GET` | 获取当前 16 路测试通道实时连接状态 |
| `/api/realtime/stream_point`| `GET` | 获取指定通道高频示波采样点数据 |
| `/api/report/generate` | `POST` | 生成标准化电池健康与低碳综合评估报告 |
