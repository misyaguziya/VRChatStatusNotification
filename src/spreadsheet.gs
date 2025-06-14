/**
 * StatusPage Webhook対応版スプレッドシート管理
 * Component Update、Incident Update、Discord Embed、汎用形式に対応
 */

/**
 * 外部WebhookからのVRChat障害データをスプレッドシートに書き込む
 * @param {Object} data - 書き込むデータ
 */
function writeToSpreadsheet(data) {
  try {
    const sheet = getStatusSheet();
    
    // ヘッダーが存在しない場合は作成
    if (sheet.getLastRow() === 0) {
      createHeaders(sheet);
    }
    
    // データを行として追加
    const row = buildRowData(data);
    
    sheet.appendRow(row);
    
    // セルの書式設定
    const lastRow = sheet.getLastRow();
    formatNewRow(sheet, lastRow, data);
    
    console.log(`Data written to spreadsheet at row ${lastRow}: ${data.title} (Type: ${data.type})`);
    
    // Note: Discord通知はmain.gsで処理される
    
  } catch (error) {
    console.error('Error writing to spreadsheet:', error);
    throw error;
  }
}

/**
 * データから行データを構築
 * @param {Object} data - 整形されたデータ
 * @return {Array} スプレッドシート行データ
 */
function buildRowData(data) {
  return [
    data.timestamp || '',
    data.id || '',
    data.type || '',
    data.source || '',
    data.title || '',
    data.description || '',
    data.severity || '',
    data.status || '',
    data.affected_components || '',
    data.url || '',
    data.page_info?.id || '',
    data.page_info?.status_description || '',
    data.component_info?.id || data.incident_info?.id || '',
    data.component_info?.name || data.incident_info?.name || '',
    data.component_info?.old_status || '',
    data.component_info?.new_status || data.incident_info?.status || '',
    data.incident_info?.impact || '',
    data.component_info?.created_at || data.incident_info?.created_at || '',
    data.incident_info?.updated_at || '',
    data.incident_info?.resolved_at || '',
    data.fields ? JSON.stringify(data.fields) : '',
    data.footer || '',
    data.raw_data || ''
  ];
}

/**
 * スプレッドシートを取得または作成
 * @return {Sheet} スプレッドシートオブジェクト
 */
function getStatusSheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const sheetName = 'VRChat_Status';
  
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID not configured in script properties');
  }
  
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  // シートが存在しない場合は作成
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    console.log('Created new sheet:', sheetName);
  }
  
  return sheet;
}

/**
 * StatusPage Webhook対応版スプレッドシートヘッダーを作成
 * @param {Sheet} sheet - 対象のシート
 */
function createHeaders(sheet) {
  const headers = [
    'Timestamp',
    'ID',
    'Type',
    'Source',
    'Title',
    'Description',
    'Severity',
    'Status',
    'Affected Components',
    'URL',
    'Page ID',
    'Page Status',
    'Component/Incident ID',
    'Component/Incident Name',
    'Old Status',
    'New/Current Status',
    'Impact',
    'Created At',
    'Updated At',
    'Resolved At',
    'Fields',
    'Footer',
    'Raw Data'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // ヘッダーの書式設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setWrap(true);
  headerRange.setVerticalAlignment('middle');
  
  // 列幅の調整
  sheet.setColumnWidth(1, 150);  // Timestamp
  sheet.setColumnWidth(2, 120);  // ID
  sheet.setColumnWidth(3, 120);  // Type
  sheet.setColumnWidth(4, 140);  // Source
  sheet.setColumnWidth(5, 250);  // Title
  sheet.setColumnWidth(6, 300);  // Description
  sheet.setColumnWidth(7, 100);  // Severity
  sheet.setColumnWidth(8, 120);  // Status
  sheet.setColumnWidth(9, 200);  // Affected Components
  sheet.setColumnWidth(10, 200); // URL
  sheet.setColumnWidth(11, 120); // Page ID
  sheet.setColumnWidth(12, 150); // Page Status
  sheet.setColumnWidth(13, 150); // Component/Incident ID
  sheet.setColumnWidth(14, 200); // Component/Incident Name
  sheet.setColumnWidth(15, 120); // Old Status
  sheet.setColumnWidth(16, 120); // New/Current Status
  sheet.setColumnWidth(17, 100); // Impact
  sheet.setColumnWidth(18, 150); // Created At
  sheet.setColumnWidth(19, 150); // Updated At
  sheet.setColumnWidth(20, 150); // Resolved At
  sheet.setColumnWidth(21, 250); // Fields
  sheet.setColumnWidth(22, 120); // Footer
  sheet.setColumnWidth(23, 150); // Raw Data
  
  console.log('Headers created for StatusPage webhook tracking');
}

/**
 * 新しい行の書式設定（StatusPage対応版）
 * @param {Sheet} sheet - 対象のシート
 * @param {number} row - 行番号
 * @param {Object} data - データオブジェクト
 */
function formatNewRow(sheet, row, data) {
  try {
    const totalColumns = 23; // StatusPage対応の全列数
    
    // 重要度に基づいて行の背景色を設定
    const severity = data.severity || '';
    let backgroundColor = '#ffffff';
    
    switch (severity.toLowerCase()) {
      case 'critical':
        backgroundColor = '#ffebee';
        break;
      case 'major':
        backgroundColor = '#fff3e0';
        break;
      case 'minor':
        backgroundColor = '#f3e5f5';
        break;
      case 'info':
        backgroundColor = '#e8f5e8';
        break;
      case 'maintenance':
        backgroundColor = '#e1f5fe';
        break;
    }
    
    sheet.getRange(row, 1, 1, totalColumns).setBackground(backgroundColor);
    
    // URLがある場合はリンクとして設定
    const urlCell = sheet.getRange(row, 10); // URL列
    const url = urlCell.getValue();
    if (url && url.startsWith('http')) {
      urlCell.setFormula(`=HYPERLINK("${url}","View")`);
    }
    
    // タイムスタンプの書式設定
    sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // 作成日時と更新日時の書式設定
    sheet.getRange(row, 18).setNumberFormat('yyyy-mm-dd hh:mm:ss'); // Created At
    sheet.getRange(row, 19).setNumberFormat('yyyy-mm-dd hh:mm:ss'); // Updated At
    sheet.getRange(row, 20).setNumberFormat('yyyy-mm-dd hh:mm:ss'); // Resolved At
    
    // テキスト折り返し設定
    sheet.getRange(row, 5).setWrap(true);  // Description
    sheet.getRange(row, 21).setWrap(true); // Fields
    sheet.getRange(row, 23).setWrap(true); // Raw Data
    
    // データタイプに応じた特別な書式設定
    applyTypeSpecificFormatting(sheet, row, data);
    
  } catch (error) {
    console.error('Error formatting row:', error);
  }
}

/**
 * データタイプに応じた特別な書式設定
 * @param {Sheet} sheet - 対象のシート
 * @param {number} row - 行番号
 * @param {Object} data - データオブジェクト
 */
function applyTypeSpecificFormatting(sheet, row, data) {
  try {
    // Component Update の場合
    if (data.type === 'component_update') {
      const oldStatusCell = sheet.getRange(row, 15); // Old Status列
      const newStatusCell = sheet.getRange(row, 16); // New Status列
      
      oldStatusCell.setFontColor('#666666');
      newStatusCell.setFontWeight('bold');
      
      // ステータス改善の場合は緑、悪化の場合は赤
      if (data.component_info?.old_status && data.component_info?.new_status) {
        if (isStatusImprovement(data.component_info.old_status, data.component_info.new_status)) {
          newStatusCell.setFontColor('#0f9d58'); // Green
        } else if (isStatusDegradation(data.component_info.old_status, data.component_info.new_status)) {
          newStatusCell.setFontColor('#db4437'); // Red
        }
      }
    }
    
    // Incident Update の場合
    if (data.type === 'incident_update') {
      // 解決済みの場合は緑で強調
      if (data.incident_info?.resolved_at) {
        const resolvedCell = sheet.getRange(row, 20); // Resolved At列
        resolvedCell.setBackground('#e8f5e8');
        resolvedCell.setFontWeight('bold');
      }
      
      // 影響度に応じた強調
      const impactCell = sheet.getRange(row, 17); // Impact列
      if (data.incident_info?.impact === 'critical') {
        impactCell.setFontColor('#db4437');
        impactCell.setFontWeight('bold');
      }
    }
    
    // Discord Embed の場合
    if (data.type === 'discord_embed') {
      const typeCell = sheet.getRange(row, 3); // Type列
      typeCell.setFontStyle('italic');
    }
    
  } catch (error) {
    console.error('Error applying type-specific formatting:', error);
  }
}

/**
 * ステータスの改善を判定
 * @param {string} oldStatus - 古いステータス
 * @param {string} newStatus - 新しいステータス
 * @return {boolean} 改善したかどうか
 */
function isStatusImprovement(oldStatus, newStatus) {
  const statusPriority = {
    'major_outage': 4,
    'partial_outage': 3,
    'degraded_performance': 2,
    'under_maintenance': 1,
    'operational': 0
  };
  
  return (statusPriority[oldStatus] || 0) > (statusPriority[newStatus] || 0);
}

/**
 * ステータスの悪化を判定
 * @param {string} oldStatus - 古いステータス
 * @param {string} newStatus - 新しいステータス
 * @return {boolean} 悪化したかどうか
 */
function isStatusDegradation(oldStatus, newStatus) {
  const statusPriority = {
    'major_outage': 4,
    'partial_outage': 3,
    'degraded_performance': 2,
    'under_maintenance': 1,
    'operational': 0
  };
  
  return (statusPriority[oldStatus] || 0) < (statusPriority[newStatus] || 0);
}

/**
 * ユニークIDを生成
 * @return {string} 生成されたID
 */
function generateId() {
  return 'ID_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 過去7日間のWebhook受信統計を取得
 * @return {Object} 統計データ
 */
function getWeeklyStats() {
  const sheet = getStatusSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return { 
      total: 0, 
      bySource: {},
      byImpact: { critical: 0, major: 0, minor: 0, maintenance: 0 },
      lastReceived: null
    };
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentData = data.filter(row => {
    const timestamp = new Date(row[0]);
    return timestamp > oneWeekAgo;
  });
  
  const stats = {
    total: recentData.length,
    bySource: {},
    byImpact: { critical: 0, major: 0, minor: 0, maintenance: 0 },
    lastReceived: recentData.length > 0 ? new Date(Math.max(...recentData.map(row => new Date(row[0])))) : null
  };
  
  recentData.forEach(row => {
    const source = row[2]; // ソース列
    const impact = row[5]; // 影響度列
    
    // ソース別統計
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    
    // 影響度別統計
    if (stats.byImpact.hasOwnProperty(impact.toLowerCase())) {
      stats.byImpact[impact.toLowerCase()]++;
    }
  });
  
  return stats;
}

/**
 * スプレッドシートの設定を初期化
 */
function initializeSpreadsheet() {
  try {
    const sheet = getStatusSheet();
    
    if (sheet.getLastRow() === 0) {
      createHeaders(sheet);
    }
    
    // フィルター機能を有効化
    const range = sheet.getDataRange();
    range.createFilter();
    
    console.log('Spreadsheet initialized successfully');
    
  } catch (error) {
    console.error('Error initializing spreadsheet:', error);
  }
}

/**
 * 設定情報をテスト
 */
function testSpreadsheetSetup() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const webhookUrl = properties.getProperty('DISCORD_WEBHOOK_URL');
  
  console.log('Spreadsheet ID:', spreadsheetId ? 'Configured' : 'Not configured');
  console.log('Discord Webhook URL:', webhookUrl ? 'Configured' : 'Not configured');
  
  if (spreadsheetId) {
    try {
      const sheet = getStatusSheet();
      console.log('Spreadsheet access: OK');
      console.log('Sheet name:', sheet.getName());
      console.log('Last row:', sheet.getLastRow());
    } catch (error) {
      console.error('Spreadsheet access error:', error);
    }
  }
}