#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 批量下载 Google Arts & Culture 高清图片
 * 使用 dezoomify-rs-mac 工具
 */
class BatchDownloader {
  constructor() {
    this.scriptPath = path.join(__dirname, 'dezoomify-rs-mac');
    this.outputDir = __dirname;
    this.downloadedCount = 0;
    this.failedCount = 0;
    this.results = [];
  }

  /**
   * 检查 dezoomify-rs-mac 是否存在
   */
  checkScript() {
    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`dezoomify-rs-mac 不存在于路径: ${this.scriptPath}`);
    }
    
    // 确保脚本有执行权限
    try {
      fs.chmodSync(this.scriptPath, '755');
    } catch (error) {
      console.warn('无法设置执行权限:', error.message);
    }
  }

  /**
   * 下载单个 URL
   * @param {string} url - Google Arts & Culture URL
   * @param {number} zoomLevel - 缩放级别 (0-4, 默认为4最高清)
   * @returns {Promise<Object>} 下载结果
   */
  async downloadSingle(url, zoomLevel = 4) {
    return new Promise((resolve) => {
      console.log(`\n开始下载: ${url}`);
      console.log(`缩放级别: ${zoomLevel}`);
      
      const startTime = Date.now();
      const child = spawn(this.scriptPath, [], {
        cwd: this.outputDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';
      let hasFoundLevels = false;
      let hasSelectedLevel = false;

      // 处理标准输出
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());

        // 检测到缩放级别选择提示
        if (text.includes('Which level do you want to download?') && !hasSelectedLevel) {
          hasSelectedLevel = true;
          child.stdin.write(`${zoomLevel}\n`);
        }
      });

      // 处理错误输出
      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text.trim());
      });

      // 进程结束处理
      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        const result = {
          url,
          zoomLevel,
          success: code === 0,
          duration,
          output,
          error: errorOutput,
          timestamp: new Date().toISOString()
        };

        if (code === 0) {
          console.log(`✅ 下载成功! 耗时: ${duration}秒`);
          this.downloadedCount++;
          
          // 尝试从输出中提取文件名
          const fileMatch = output.match(/Image successfully saved to '([^']+)'/);
          if (fileMatch) {
            result.filename = path.basename(fileMatch[1]);
            console.log(`📁 文件名: ${result.filename}`);
          }
        } else {
          console.log(`❌ 下载失败! 错误代码: ${code}`);
          this.failedCount++;
        }

        this.results.push(result);
        resolve(result);
      });

      // 发送 URL
      child.stdin.write(`${url}\n`);

      // 设置超时 (10分钟)
      const timeout = setTimeout(() => {
        console.log('⏰ 下载超时，终止进程...');
        child.kill('SIGTERM');
      }, 10 * 60 * 1000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * 批量下载多个 URL
   * @param {Array} urls - URL 列表
   * @param {number} zoomLevel - 缩放级别
   * @param {number} concurrent - 并发数量
   */
  async downloadBatch(urls, zoomLevel = 4, concurrent = 1) {
    console.log(`🚀 开始批量下载 ${urls.length} 个图片`);
    console.log(`📊 缩放级别: ${zoomLevel}, 并发数: ${concurrent}`);
    
    this.checkScript();
    
    const startTime = Date.now();
    
    // 分批处理，避免过多并发
    for (let i = 0; i < urls.length; i += concurrent) {
      const batch = urls.slice(i, i + concurrent);
      const promises = batch.map(url => this.downloadSingle(url, zoomLevel));
      
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error('批次处理错误:', error);
      }
      
      // 显示进度
      const completed = Math.min(i + concurrent, urls.length);
      console.log(`\n📈 进度: ${completed}/${urls.length} (${Math.round(completed/urls.length*100)}%)`);
      
      // 批次间暂停，避免过于频繁的请求
      if (i + concurrent < urls.length) {
        console.log('⏸️  暂停 2 秒...\n');
        await this.sleep(2000);
      }
    }
    
    const endTime = Date.now();
    const totalDuration = Math.round((endTime - startTime) / 1000);
    
    // 输出总结
    this.printSummary(totalDuration);
    
    // 保存结果到文件
    this.saveResults();
    
    return this.results;
  }

  /**
   * 从文件读取 URL 列表
   * @param {string} filePath - 文件路径
   * @returns {Array} URL 列表
   */
  readUrlsFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const urls = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.includes('artsandculture.google.com'));
      
      console.log(`📖 从文件读取到 ${urls.length} 个有效 URL`);
      return urls;
    } catch (error) {
      throw new Error(`无法读取文件 ${filePath}: ${error.message}`);
    }
  }

  /**
   * 打印下载总结
   */
  printSummary(totalDuration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 下载总结');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${this.downloadedCount}`);
    console.log(`❌ 失败: ${this.failedCount}`);
    console.log(`⏱️  总耗时: ${totalDuration} 秒`);
    console.log(`📁 输出目录: ${this.outputDir}`);
    
    if (this.failedCount > 0) {
      console.log('\n❌ 失败的 URL:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.url}`));
    }
  }

  /**
   * 保存结果到 JSON 文件
   */
  saveResults() {
    const resultFile = path.join(this.outputDir, `download-results-${Date.now()}.json`);
    try {
      fs.writeFileSync(resultFile, JSON.stringify(this.results, null, 2));
      console.log(`💾 结果已保存到: ${resultFile}`);
    } catch (error) {
      console.error('保存结果失败:', error.message);
    }
  }

  /**
   * 休眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 命令行使用示例
async function main() {
  const downloader = new BatchDownloader();
  
  // 示例 URL 列表
  const sampleUrls = [
    'https://artsandculture.google.com/asset/sunflowers-文森特·梵高/hwEGmsM-FoHAwA',
    'https://artsandculture.google.com/asset/the-starry-night/bgEuwDxel93-Uw',
    // 可以添加更多 URL
  ];
  
  try {
    // 方式1: 直接使用 URL 数组
    console.log('🎯 方式1: 使用预定义 URL 列表');
    await downloader.downloadBatch(sampleUrls, 4, 1);
    
    // 方式2: 从文件读取 URL (如果文件存在)
    const urlFile = path.join(__dirname, 'urls.txt');
    if (fs.existsSync(urlFile)) {
      console.log('\n🎯 方式2: 从文件读取 URL');
      const urlsFromFile = downloader.readUrlsFromFile(urlFile);
      await downloader.downloadBatch(urlsFromFile, 4, 1);
    } else {
      console.log(`\n💡 提示: 创建 ${urlFile} 文件来批量下载更多图片`);
      console.log('文件格式: 每行一个 URL');
    }
    
  } catch (error) {
    console.error('❌ 批量下载失败:', error.message);
    process.exit(1);
  }
}

// 导出类供其他脚本使用
module.exports = BatchDownloader;

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
