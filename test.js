#!/usr/bin/env node

/**
 * 易舍爬虫工具测试脚本
 * 用于验证基本功能是否正常
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 易舍爬虫工具测试');
console.log('='.repeat(50));

// 测试1: 检查文件是否存在
function testFiles() {
  console.log('\n📁 测试1: 检查必要文件');
  
  const requiredFiles = [
    'cli.js',
    'example.js',
    'package.json',
    'start.sh',
    'start.bat'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - 存在`);
    } else {
      console.log(`❌ ${file} - 不存在`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// 测试2: 检查依赖
function testDependencies() {
  console.log('\n📦 测试2: 检查依赖');
  
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules 目录存在');
    
    // 检查关键依赖
    const keyDeps = [
      'puppeteer',
      'axios',
      'inquirer',
      'chalk',
      'ora'
    ];
    
    let allDepsExist = true;
    
    for (const dep of keyDeps) {
      const depPath = path.join('node_modules', dep);
      if (fs.existsSync(depPath)) {
        console.log(`✅ ${dep} - 已安装`);
      } else {
        console.log(`❌ ${dep} - 未安装`);
        allDepsExist = false;
      }
    }
    
    return allDepsExist;
  } else {
    console.log('❌ node_modules 目录不存在，需要运行 npm install');
    return false;
  }
}

// 测试3: 检查模块导入
function testImports() {
  console.log('\n🔧 测试3: 检查模块导入');
  
  try {
    // 测试 chalk
    const chalk = require('chalk');
    console.log('✅ chalk 模块导入成功');
    
    // 测试 inquirer
    const inquirer = require('inquirer');
    console.log('✅ inquirer 模块导入成功');
    
    // 测试 ora
    const ora = require('ora');
    console.log('✅ ora 模块导入成功');
    
    // 测试 axios
    const axios = require('axios');
    console.log('✅ axios 模块导入成功');
    
    return true;
  } catch (error) {
    console.log(`❌ 模块导入失败: ${error.message}`);
    return false;
  }
}

// 测试4: 检查配置功能
function testConfig() {
  console.log('\n⚙️  测试4: 检查配置功能');
  
  try {
    const { loadConfig, saveConfig } = require('./cli');
    
    // 测试加载配置
    const config = loadConfig();
    console.log('✅ 配置加载成功:', config);
    
    // 测试保存配置
    const testConfig = { ...config, test: true };
    const saveResult = saveConfig(testConfig);
    console.log(`✅ 配置保存${saveResult ? '成功' : '失败'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ 配置功能测试失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  const results = [];
  
  results.push(testFiles());
  results.push(testDependencies());
  results.push(testImports());
  results.push(testConfig());
  
  console.log('\n📊 测试结果汇总');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！系统可以正常运行。');
    console.log('\n🚀 运行以下命令启动程序:');
    console.log('   npm start');
    console.log('   或');
    console.log('   ./start.sh (Linux/macOS)');
    console.log('   或');
    console.log('   start.bat (Windows)');
  } else {
    console.log('❌ 部分测试失败，请检查上述错误信息。');
    console.log('\n💡 建议运行以下命令修复问题:');
    console.log('   npm install');
  }
}

// 运行测试
runTests().catch(console.error); 