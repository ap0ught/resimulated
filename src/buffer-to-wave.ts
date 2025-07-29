// https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/
// Convert an AudioBuffer to a Blob using WAVE representation
// AudioBufferをWAVE形式のBlobに変換します
/**
 * Convert an AudioBuffer to WAVE format binary data
 * AudioBufferをWAVE形式のバイナリデータに変換します
 * 
 * Creates a proper WAVE file header with PCM audio data
 * PCMオーディオデータと適切なWAVEファイルヘッダーを作成します
 * 
 * @param abuffer The AudioBuffer to convert / 変換するAudioBuffer
 * @param len Length of audio data to include / 含めるオーディオデータの長さ
 */
export function bufferToWave(abuffer: AudioBuffer, len: number) {
    var numOfChan = abuffer.numberOfChannels,
        length = Math.floor(len * numOfChan * 2 + 44),
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    // WAVEヘッダーを書き込みます (Write WAVE header)
    setUint32(0x46464952);                         // "RIFF" - File format identifier / ファイル形式識別子
    setUint32(length - 8);                         // file length - 8 / ファイル長 - 8
    setUint32(0x45564157);                         // "WAVE" - File type / ファイルタイプ

    setUint32(0x20746d66);                         // "fmt " chunk - Format chunk / フォーマットチャンク
    setUint32(16);                                 // length = 16 / 長さ = 16
    setUint16(1);                                  // PCM (uncompressed) / PCM（非圧縮）
    setUint16(numOfChan);                          // Number of channels / チャンネル数
    setUint32(abuffer.sampleRate);                 // Sample rate / サンプルレート
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec / 平均バイト/秒
    setUint16(numOfChan * 2);                      // block-align / ブロックアライン
    setUint16(16);                                 // 16-bit (hardcoded in this demo) / 16ビット（このデモではハードコード）

    setUint32(0x61746164);                         // "data" - chunk / データチャンク
    setUint32(length - pos - 4);                   // chunk length / チャンク長

    // write interleaved data
    // インターリーブデータを書き込みます (Write interleaved data)
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels / チャンネルをインターリーブ
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp / クランプ
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int / 16ビット符号付き整数にスケール
            view.setInt16(pos, sample, true);          // write 16-bit sample / 16ビットサンプルを書き込み
            pos += 2;
        }
        offset++                                     // next source sample / 次のソースサンプル
    }

    // create Blob
    // Blobを作成します (Create Blob)
    return new Blob([buffer], { type: "audio/wav" });

    /**
     * Helper function to write 16-bit unsigned integer
     * 16ビット符号なし整数を書き込むヘルパー関数
     */
    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    /**
     * Helper function to write 32-bit unsigned integer
     * 32ビット符号なし整数を書き込むヘルパー関数
     */
    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}