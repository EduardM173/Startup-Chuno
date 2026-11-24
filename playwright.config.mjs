import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',workers:1,fullyParallel:false,retries:0,timeout:180000,use:{actionTimeout:15000,baseURL:'http://localhost:8080',browserName:'chromium',channel:'chrome',headless:true,viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'off'},reporter:[['list']],outputDir:'test-results'});
