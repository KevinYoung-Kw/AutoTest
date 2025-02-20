import subprocess
import sys
import os
from loguru import logger

def install_dependencies():
    """安装项目依赖"""
    try:
        logger.info("正在安装Python依赖...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        
        logger.info("正在安装Playwright...")
        subprocess.run([sys.executable, "-m", "playwright", "install"], check=True)
        
        logger.info("依赖安装完成")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"依赖安装失败: {str(e)}")
        return False

def create_directories():
    """创建必要的目录"""
    directories = ["projects", "logs"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"创建目录: {directory}")

def main():
    """主函数"""
    logger.info("开始初始化项目环境...")
    
    if not install_dependencies():
        sys.exit(1)
        
    create_directories()
    
    logger.info("项目环境初始化完成")
    logger.info("您可以通过运行 'python main.py' 启动应用程序")

if __name__ == "__main__":
    main() 