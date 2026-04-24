const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
  try {
    const videoId = '8bZXZuPlAGg';
    console.log(`Fetching transcript for ${videoId}...`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log('Success!');
    console.log('Transcript length:', transcript.length);
    console.log('Sample:', transcript.slice(0, 5).map(t => t.text).join(' '));
  } catch (error) {
    console.error('Error fetching transcript:', error.message);
  }
}

test();
