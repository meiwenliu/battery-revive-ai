# -*- coding: utf-8 -*-
"""实时测试设备数据直连接口与动态采样流 API"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import time
import math
import random

router = APIRouter(prefix="/realtime", tags=["实时测试设备直连接口"])

# 模拟 16 通道硬件状态
CHANNELS_STATE = [
    {
        "channel_id": f"CH{i:02d}",
        "battery_id": f"LFP-35Ah-DEV-{i:02d}",
        "chemistry": "LFP (磷酸铁锂)",
        "nominal_capacity_ah": 35.0,
        "status": "TESTING" if i <= 4 else ("STANDBY" if i <= 12 else "OFFLINE"),
        "voltage_v": round(3.28 + math.sin(i) * 0.04, 4),
        "current_a": round(-17.5 if i <= 4 else 0.0, 2),
        "temperature_c": round(25.4 + i * 0.3, 1),
        "internal_res_mohm": round(12.5 + i * 0.4, 2),
        "soc_pct": round(max(30.0, 90.0 - i * 4.5), 1),
        "current_protocol": "SINGLE50 极速脉冲测试" if i <= 4 else "待机就绪",
        "elapsed_time_s": int(time.time() % 180) if i <= 4 else 0
    }
    for i in range(1, 17)
]


@router.get("/channels", summary="获取当前 16 路测试通道实时连接状态")
async def get_channels() -> List[Dict[str, Any]]:
    # 动态微调电压与电流，模拟真实硬件在线波形
    t = time.time()
    for ch in CHANNELS_STATE:
        if ch["status"] == "TESTING":
            idx = int(ch["channel_id"][2:])
            ch["voltage_v"] = round(3.28 + 0.03 * math.sin(t * 1.5 + idx), 4)
            ch["temperature_c"] = round(25.0 + 1.2 * math.sin(t * 0.1 + idx), 1)
            ch["elapsed_time_s"] = int(t % 180)
    return CHANNELS_STATE


@router.get("/stream_point", summary="获取指定通道高频实时示波采样点")
async def get_stream_point(channel_id: str = "CH01") -> Dict[str, Any]:
    t = time.time()
    v_base = 3.295
    # 构造脉冲曲线形态
    phase = int(t % 60)
    if phase < 15:
        curr = 0.0
        volt = v_base
    elif phase < 35:
        curr = 17.5  # 0.5C 充电
        volt = v_base + 0.045 + 0.005 * math.log(phase - 14)
    elif phase < 45:
        curr = -35.0  # 1.0C 放电
        volt = v_base - 0.065 - 0.005 * math.log(phase - 34)
    else:
        curr = 0.0  # 撤载松弛
        volt = v_base - 0.015 + 0.010 * (1.0 - math.exp(-(phase - 45) / 5.0))

    return {
        "timestamp_ms": int(t * 1000),
        "channel_id": channel_id,
        "voltage_v": round(volt + random.gauss(0, 0.0008), 4),
        "current_a": round(curr + random.gauss(0, 0.02), 2),
        "temperature_c": round(25.6 + random.gauss(0, 0.05), 1),
        "internal_res_mohm": round(12.8 + random.gauss(0, 0.03), 2)
    }
