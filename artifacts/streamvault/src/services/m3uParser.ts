export interface M3UChannel {
  name: string;
  logo: string;
  group: string;
  url: string;
}

export function parseM3U(data: string): M3UChannel[] {
  const lines = data.split('\n');
  const channels: M3UChannel[] = [];
  
  let currentChannel: Partial<M3UChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      currentChannel.logo = logoMatch ? logoMatch[1] : '';
      
      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/);
      currentChannel.group = groupMatch ? groupMatch[1] : 'Uncategorized';
      
      // Extract name (everything after the last comma)
      const nameParts = line.split(',');
      currentChannel.name = nameParts.length > 1 ? nameParts.pop()?.trim() || 'Unknown Channel' : 'Unknown Channel';
      
    } else if (line && !line.startsWith('#')) {
      if (currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as M3UChannel);
        currentChannel = {}; // reset for next
      }
    }
  }
  
  return channels;
}