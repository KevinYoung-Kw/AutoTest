from loguru import logger
import sys
import os

def setup_logger():
    """配置日志系统"""
    # 确保日志目录存在
    os.makedirs("logs", exist_ok=True)
    
    # 移除默认的处理器
    logger.remove()
    
    # 添加控制台输出
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    # 添加操作日志文件
    logger.add(
        "logs/operation.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="1 day",
        retention="7 days",
        level="INFO"
    )
    
    # 添加执行日志文件
    logger.add(
        "logs/execution.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="1 day",
        retention="7 days",
        level="DEBUG"
    )
    
    return logger

# 导出配置好的logger实例
logger = setup_logger() 