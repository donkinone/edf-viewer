// 演示数据 - 用于在没有Java后端时测试前端功能
const DEMO_DATA = [
  {
    fileName: "test_sample.edf",
    fileSize: 3774976,
    patientId: "X X X X",
    recordId: "Startdate 02-AUG-1951 X X PSG",
    startDate: "02.08.51",
    startTime: "20.20.00",
    duration: 600,
    numberOfRecords: 2400,
    channelCount: 16,
    channels: [
      {
        index: 1,
        label: "EEG Fp1-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 2,
        label: "EEG Fp2-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 3,
        label: "EEG F3-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 4,
        label: "EEG F4-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 5,
        label: "EEG C3-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 6,
        label: "EEG C4-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 7,
        label: "EEG P3-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 8,
        label: "EEG P4-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 9,
        label: "EEG O1-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 10,
        label: "EEG O2-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 11,
        label: "EEG F7-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 12,
        label: "EEG F8-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 13,
        label: "EEG T3-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 14,
        label: "EEG T4-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 15,
        label: "EEG T5-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      },
      {
        index: 16,
        label: "EEG T6-Ref",
        transducerType: "AgAgCl electrode",
        physicalDimension: "uV",
        physicalMinimum: -3276.8,
        physicalMaximum: 3276.7,
        digitalMinimum: -32768,
        digitalMaximum: 32767,
        prefiltering: "HP:0.1Hz LP:75Hz",
        samplesPerRecord: 100
      }
    ]
  }
];

// 模拟API响应
function simulateApiResponse() {
  return {
    success: true,
    message: "文件解析成功（演示模式）",
    data: DEMO_DATA
  };
} 