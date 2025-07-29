/**
 * Audio Buffer to WAVE File Conversion Utility
 * 
 * This module provides functionality to convert WebAudio API AudioBuffer objects
 * into downloadable WAVE audio files. This is essential for exporting rendered
 * audio content, such as procedurally generated music or sound effects.
 * 
 * The WAVE format is a widely supported uncompressed audio format that stores
 * audio data as raw PCM (Pulse Code Modulation) samples with a descriptive header.
 * 
 * Based on the implementation by Russell Good:
 * https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/
 */

/**
 * Converts an AudioBuffer to a WAVE format Blob for download or storage.
 * 
 * This function creates a properly formatted WAVE file with:
 * - RIFF container format header
 * - Format chunk describing audio parameters  
 * - Data chunk containing the actual audio samples
 * 
 * The audio data is converted from floating-point format (used by WebAudio)
 * to 16-bit signed integer format (standard for WAVE files) with proper
 * clipping to prevent overflow distortion.
 * 
 * @param abuffer - The AudioBuffer object containing the audio data
 * @param len - The number of samples to include in the output
 * @returns A Blob containing the WAVE-formatted audio file
 */
export function bufferToWave(abuffer: AudioBuffer, len: number) {
    var numOfChan = abuffer.numberOfChannels,
        length = Math.floor(len * numOfChan * 2 + 44),
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    /**
     * WAVE File Header Construction
     * 
     * The WAVE format consists of several chunks that describe the audio data:
     * 1. RIFF header - identifies this as a RIFF container
     * 2. Format chunk - describes audio parameters (sample rate, bit depth, etc.)
     * 3. Data chunk - contains the actual audio samples
     */
    
    /* RIFF Container Header */
    setUint32(0x46464952);                         // "RIFF" magic number
    setUint32(length - 8);                         // File length minus RIFF header
    setUint32(0x45564157);                         // "WAVE" format identifier

    /* Format Chunk - describes the audio format */
    setUint32(0x20746d66);                         // "fmt " chunk identifier  
    setUint32(16);                                 // Format chunk size (16 bytes for PCM)
    setUint16(1);                                  // Audio format: 1 = PCM (uncompressed)
    setUint16(numOfChan);                          // Number of audio channels
    setUint32(abuffer.sampleRate);                 // Sample rate (samples per second)
    setUint32(abuffer.sampleRate * 2 * numOfChan); // Average bytes per second
    setUint16(numOfChan * 2);                      // Block align (bytes per sample frame)
    setUint16(16);                                 // Bits per sample (16-bit audio)

    /* Data Chunk Header */
    setUint32(0x61746164);                         // "data" chunk identifier
    setUint32(length - pos - 4);                   // Data chunk size

    /**
     * Audio Data Conversion and Interleaving
     * 
     * WebAudio uses floating-point samples in range [-1, 1]
     * WAVE format uses 16-bit signed integers in range [-32768, 32767]
     * Multiple channels are interleaved (L, R, L, R, ... for stereo)
     */
    
    /* Extract channel data from AudioBuffer */
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    /* Convert and interleave audio samples */
    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             
            /* Clamp sample to valid range to prevent clipping artifacts */
            sample = Math.max(-1, Math.min(1, channels[i][offset])); 
            
            /* Convert from float [-1, 1] to 16-bit signed integer */
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
            
            /* Write sample to buffer in little-endian format */
            view.setInt16(pos, sample, true);          
            pos += 2;
        }
        offset++                                     // Move to next sample frame
    }

    /* Create downloadable Blob with proper MIME type */
    return new Blob([buffer], { type: "audio/wav" });

    /**
     * Helper function to write 16-bit unsigned integer to buffer.
     * Uses little-endian byte order as required by WAVE format.
     */
    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    /**
     * Helper function to write 32-bit unsigned integer to buffer.
     * Uses little-endian byte order as required by WAVE format.
     */
    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}