/**
 * 外部Webhook受信のメインエントリーポイント
 * StatusPage、Discord、VRChatからのWebhook POSTリクエストを受信し、スプレッドシートに記録する
 */
function doPost(e) {
  try {
    console.log('=== Webhook received ===');
    
    // リクエストデータの取得と検証
    const postData = e.postData;
    if (!postData || !postData.contents) {
      throw new Error('No post data received');
    }
    
    console.log('Raw POST data:', postData.contents);
    
    // JSONデータの解析
    let webhookData;
    try {
      webhookData = JSON.parse(postData.contents);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid JSON format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Webhookデータの検証
    if (!validateWebhookData(webhookData)) {
      throw new Error('Invalid webhook data structure');
    }
    
    // データ抽出と変換
    const extractedData = extractStatusPageData(webhookData);
    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));
    
    // スプレッドシートに書き込み
    writeToSpreadsheet(extractedData);
    
    // Discord通知送信（設定が有効な場合）
    try {
      const enableNotification = PropertiesService.getScriptProperties().getProperty('ENABLE_DISCORD_NOTIFICATION');
      console.log('Discord notification enabled:', enableNotification);
      
      if (enableNotification === 'true') {
        console.log('Sending Discord notification...');
        sendDiscordNotification(extractedData);
      } else {
        console.log('Discord notification is disabled');
      }
    } catch (notificationError) {
      console.error('Error sending Discord notification:', notificationError);
      // Discord通知エラーは処理を止めない
    }
    
    // 成功レスポンス
    const response = {
      status: 'success',
      message: 'Data logged successfully',
      timestamp: new Date().toISOString(),
      data_type: extractedData.type,
      id: extractedData.id
    };
    
    console.log('=== Webhook processed successfully ===');
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    const errorResponse = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTTPレスポンスを作成
 * @param {string} status - レスポンスステータス
 * @param {string} message - レスポンスメッセージ
 * @param {number} httpCode - HTTPステータスコード
 * @return {ContentService.TextOutput} レスポンス
 */
function createResponse(status, message, httpCode) {
  const response = ContentService.createTextOutput(JSON.stringify({
    status: status,
    message: message,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
  
  // HTTPステータスコードは直接設定できないが、ログに記録
  console.log(`Response: ${httpCode} - ${message}`);
  
  return response;
}

/**
 * StatusPage Webhookデータを抽出して統一フォーマットに変換
 * Component Update、Incident Update、Discord Embed、汎用形式に対応
 */
function extractStatusPageData(data) {
  const timestamp = new Date().toISOString();
  
  // Component Update の場合
  if (data.component_update && data.component) {
    return {
      id: data.component_update.id || 'unknown',
      type: 'component_update',
      source: 'StatusPage Component',
      timestamp: data.component_update.created_at || timestamp,
      title: `Component Update: ${data.component.name}`,
      description: `Status changed from ${data.component_update.old_status} to ${data.component_update.new_status}`,
      severity: mapComponentStatusToSeverity(data.component_update.new_status),
      status: mapComponentStatusToReadable(data.component_update.new_status),
      affected_components: data.component.name,
      url: data.page ? `https://status.vrchat.com` : '',
      page_info: {
        id: data.page?.id || '',
        status_indicator: data.page?.status_indicator || '',
        status_description: data.page?.status_description || ''
      },
      component_info: {
        id: data.component.id,
        name: data.component.name,
        old_status: data.component_update.old_status,
        new_status: data.component_update.new_status,
        created_at: data.component.created_at
      },
      fields: [
        { name: 'Component', value: data.component.name, inline: true },
        { name: 'Old Status', value: data.component_update.old_status, inline: true },
        { name: 'New Status', value: data.component_update.new_status, inline: true }
      ],
      footer: 'StatusPage Component Update',
      raw_data: JSON.stringify(data)
    };
  }
  
  // Incident Update の場合
  if (data.incident) {
    const incident = data.incident;
    const latestUpdate = incident.incident_updates && incident.incident_updates.length > 0 
      ? incident.incident_updates[0] 
      : null;
    
    return {
      id: incident.id || 'unknown',
      type: 'incident_update',
      source: 'StatusPage Incident',
      timestamp: incident.updated_at || incident.created_at || timestamp,
      title: incident.name || 'Unknown Incident',
      description: latestUpdate ? latestUpdate.body : 'No description available',
      severity: mapIncidentImpactToSeverity(incident.impact),
      status: mapIncidentStatusToReadable(incident.status),
      affected_components: extractAffectedComponents(data),
      url: incident.shortlink || '',
      page_info: {
        id: data.page?.id || '',
        status_indicator: data.page?.status_indicator || '',
        status_description: data.page?.status_description || ''
      },
      incident_info: {
        id: incident.id,
        name: incident.name,
        impact: incident.impact,
        status: incident.status,
        created_at: incident.created_at,
        updated_at: incident.updated_at,
        resolved_at: incident.resolved_at,
        monitoring_at: incident.monitoring_at,
        backfilled: incident.backfilled,
        scheduled_for: incident.scheduled_for
      },
      fields: buildIncidentFields(incident, latestUpdate),
      footer: 'StatusPage Incident Update',
      raw_data: JSON.stringify(data)
    };
  }
  
  // Discord Embed形式（既存のサポート維持）
  if (data.embeds && Array.isArray(data.embeds) && data.embeds.length > 0) {
    const embed = data.embeds[0];
    return {
      id: `discord-${Date.now()}`,
      type: 'discord_embed',
      source: 'Discord Webhook',
      timestamp: embed.timestamp || timestamp,
      title: embed.title || 'Discord Notification',
      description: embed.description || '',
      severity: extractSeverityFromDiscord(embed),
      status: extractStatusFromDiscord(embed),
      affected_components: extractComponentsFromDiscord(embed),
      url: embed.url || '',
      fields: embed.fields || [],
      footer: embed.footer?.text || 'Discord Webhook',
      raw_data: JSON.stringify(data)
    };
  }
  
  // 汎用形式（既存のサポート維持）
  return {
    id: data.id || `generic-${Date.now()}`,
    type: 'generic',
    source: data.source || 'Generic Webhook',
    timestamp: data.timestamp || timestamp,
    title: data.title || 'Generic Notification',
    description: data.description || '',
    severity: data.severity || 'Unknown',
    status: data.status || 'Unknown',
    affected_components: data.affected_components || '',
    url: data.url || '',
    fields: [],
    footer: 'Generic Webhook',
    raw_data: JSON.stringify(data)
  };
}

/**
 * Webhookデータの検証
 */
function validateWebhookData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // StatusPage Component Update
  if (data.component_update && data.component) {
    return true;
  }
  
  // StatusPage Incident Update
  if (data.incident) {
    return true;
  }
  
  // Discord Embed
  if (data.embeds && Array.isArray(data.embeds)) {
    return true;
  }
  
  // 汎用形式（最低限titleまたはdescriptionが必要）
  if (data.title || data.description) {
    return true;
  }
  
  return false;
}

/**
 * コンポーネントステータスを重要度にマッピング
 */
function mapComponentStatusToSeverity(status) {
  const statusMap = {
    'operational': 'Info',
    'degraded_performance': 'Minor',
    'partial_outage': 'Major',
    'major_outage': 'Critical',
    'under_maintenance': 'Maintenance'
  };
  return statusMap[status] || 'Unknown';
}

/**
 * コンポーネントステータスを読みやすい形式に変換
 */
function mapComponentStatusToReadable(status) {
  const statusMap = {
    'operational': 'Operational',
    'degraded_performance': 'Degraded Performance',
    'partial_outage': 'Partial Outage',
    'major_outage': 'Major Outage',
    'under_maintenance': 'Under Maintenance'
  };
  return statusMap[status] || status;
}

/**
 * インシデントのimpactを重要度にマッピング
 */
function mapIncidentImpactToSeverity(impact) {
  const impactMap = {
    'none': 'Info',
    'minor': 'Minor',
    'major': 'Major',
    'critical': 'Critical',
    'maintenance': 'Maintenance'
  };
  return impactMap[impact] || 'Unknown';
}

/**
 * インシデントステータスを読みやすい形式に変換
 */
function mapIncidentStatusToReadable(status) {
  const statusMap = {
    'investigating': 'Investigating',
    'identified': 'Identified',
    'monitoring': 'Monitoring',
    'resolved': 'Resolved',
    'scheduled': 'Scheduled',
    'in_progress': 'In Progress',
    'verifying': 'Verifying',
    'completed': 'Completed'
  };
  return statusMap[status] || status;
}

/**
 * 影響を受けるコンポーネントを抽出
 */
function extractAffectedComponents(data) {
  const components = [];
  
  if (data.component && data.component.name) {
    components.push(data.component.name);
  }
  
  if (data.incident && data.incident.components) {
    data.incident.components.forEach(comp => {
      if (comp.name && !components.includes(comp.name)) {
        components.push(comp.name);
      }
    });
  }
  
  return components.join(', ');
}

/**
 * インシデントフィールドを構築
 */
function buildIncidentFields(incident, latestUpdate) {
  const fields = [
    { name: 'Impact', value: incident.impact || 'Unknown', inline: true },
    { name: 'Status', value: incident.status || 'Unknown', inline: true }
  ];
  
  if (incident.created_at) {
    fields.push({ name: 'Created', value: new Date(incident.created_at).toLocaleString(), inline: true });
  }
  
  if (incident.resolved_at) {
    fields.push({ name: 'Resolved', value: new Date(incident.resolved_at).toLocaleString(), inline: true });
  }
  
  if (latestUpdate && latestUpdate.created_at) {
    fields.push({ name: 'Last Update', value: new Date(latestUpdate.created_at).toLocaleString(), inline: true });
  }
  
  return fields;
}

/**
 * Discord Embedから重要度を抽出
 */
function extractSeverityFromDiscord(embed) {
  // 色から判定
  if (embed.color) {
    if (embed.color === 16711680) return 'Critical'; // Red
    if (embed.color === 16776960) return 'Major';    // Yellow
    if (embed.color === 65280) return 'Minor';       // Green
  }
  
  // フィールドから判定
  if (embed.fields) {
    for (const field of embed.fields) {
      if (field.name && field.name.toLowerCase().includes('severity')) {
        return field.value;
      }
    }
  }
  
  return 'Unknown';
}

/**
 * Discord Embedからステータスを抽出
 */
function extractStatusFromDiscord(embed) {
  if (embed.fields) {
    for (const field of embed.fields) {
      if (field.name && field.name.toLowerCase().includes('status')) {
        return field.value;
      }
    }
  }
  
  return 'Unknown';
}

/**
 * Discord Embedからコンポーネントを抽出
 */
function extractComponentsFromDiscord(embed) {
  if (embed.fields) {
    for (const field of embed.fields) {
      if (field.name && (field.name.toLowerCase().includes('component') || 
                         field.name.toLowerCase().includes('affected'))) {
        return field.value;
      }
    }
  }
  
  return '';
}

/**
 * Discord Webhookへの通知送信（オプション機能）
 * @param {Object} incidentData - 障害データ
 */
function sendDiscordNotification(incidentData) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  
  if (!webhookUrl) {
    console.log('Discord webhook URL not configured, skipping notification');
    return;
  }
  
  console.log('Discord webhook URL found, preparing notification...');
  
  const embed = {
    title: `📋 VRChat障害情報を記録しました`,
    description: `**${incidentData.title}**\n${incidentData.description}`,
    color: getIncidentColor(incidentData.severity?.toLowerCase() || 'unknown'),
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: 'ソース',
        value: incidentData.source,
        inline: true
      },
      {
        name: 'タイムスタンプ',
        value: new Date(incidentData.timestamp).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}),
        inline: true
      },
      {
        name: 'データタイプ',
        value: incidentData.type,
        inline: true
      }
    ]
  };
  
  if (incidentData.severity) {
    embed.fields.push({
      name: '重要度',
      value: incidentData.severity,
      inline: true
    });
  }
  
  if (incidentData.status) {
    embed.fields.push({
      name: 'ステータス',
      value: incidentData.status,
      inline: true
    });
  }
  
  if (incidentData.url) {
    embed.fields.push({
      name: 'リンク',
      value: `[詳細を見る](${incidentData.url})`,
      inline: false
    });
  }
  
  const payload = {
    embeds: [embed]
  };
  
  console.log('Sending Discord notification with payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    });
    
    const responseCode = response.getResponseCode();
    console.log('Discord API response code:', responseCode);
    
    if (responseCode === 204) {
      console.log('Discord notification sent successfully');
    } else {
      console.warn('Discord notification unexpected response:', responseCode);
      console.warn('Response content:', response.getContentText());
    }
    
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    console.error('Webhook URL (masked):', webhookUrl.substring(0, 50) + '...');
    throw error; // エラーを再スローして上位で処理
  }
}

/**
 * Discord通知設定のテスト関数
 * Apps Scriptエディタから手動実行してDiscord通知をテストできます
 */
function testDiscordNotification() {
  console.log('=== Discord Notification Test ===');
  
  // 設定確認
  const enableNotification = PropertiesService.getScriptProperties().getProperty('ENABLE_DISCORD_NOTIFICATION');
  const webhookUrl = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  
  console.log('ENABLE_DISCORD_NOTIFICATION:', enableNotification);
  console.log('DISCORD_WEBHOOK_URL configured:', webhookUrl ? 'Yes' : 'No');
  
  if (enableNotification !== 'true') {
    console.log('❌ Discord notification is disabled. Set ENABLE_DISCORD_NOTIFICATION to "true"');
    return;
  }
  
  if (!webhookUrl) {
    console.log('❌ Discord webhook URL not configured. Set DISCORD_WEBHOOK_URL property');
    return;
  }
  
  // テスト用データ
  const testData = {
    id: 'test-' + Date.now(),
    type: 'test',
    source: 'Manual Test',
    timestamp: new Date().toISOString(),
    title: 'Discord通知テスト',
    description: 'これはDiscord通知機能のテストメッセージです。',
    severity: 'Info',
    status: 'Testing',
    url: 'https://example.com'
  };
  
  try {
    sendDiscordNotification(testData);
    console.log('✅ Test notification sent successfully');
  } catch (error) {
    console.error('❌ Test notification failed:', error);
  }
}

/**
 * 現在の設定状況を確認する関数
 */
function checkConfiguration() {
  console.log('=== Configuration Check ===');
  
  const properties = PropertiesService.getScriptProperties().getProperties();
  
  console.log('Configured properties:');
  console.log('- SPREADSHEET_ID:', properties.SPREADSHEET_ID ? 'Configured' : 'Missing');
  console.log('- DISCORD_WEBHOOK_URL:', properties.DISCORD_WEBHOOK_URL ? 'Configured' : 'Missing');
  console.log('- ENABLE_DISCORD_NOTIFICATION:', properties.ENABLE_DISCORD_NOTIFICATION || 'Not set (default: false)');
  
  if (!properties.SPREADSHEET_ID) {
    console.log('⚠️ SPREADSHEET_ID is required');
  }
  
  if (!properties.DISCORD_WEBHOOK_URL) {
    console.log('⚠️ DISCORD_WEBHOOK_URL is required for Discord notifications');
  }
  
  if (properties.ENABLE_DISCORD_NOTIFICATION !== 'true') {
    console.log('⚠️ Discord notifications are disabled. Set ENABLE_DISCORD_NOTIFICATION to "true" to enable');
  }
  
  console.log('=== End Configuration Check ===');
}

/**
 * インシデントの重要度に応じた色を取得
 * @param {string} severity - 重要度
 * @return {number} Discord用カラーコード
 */
function getIncidentColor(severity) {
  const colorMap = {
    'critical': 0xFF0000,  // 赤
    'major': 0xFF6600,     // オレンジ
    'minor': 0xFFCC00,     // 黄色
    'maintenance': 0x0099FF, // 青
    'info': 0x00FF00,      // 緑
    'unknown': 0x808080,   // グレー
    'testing': 0x9932CC    // 紫（テスト用）
  };
  
  return colorMap[severity.toLowerCase()] || colorMap['unknown'];
}