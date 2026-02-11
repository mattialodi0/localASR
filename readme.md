# Local ASR pipeline
The aim is to develop a fast and precise local pipeline that sits behind an API and transcribes speech into text.

## Pipeline
.pcm -> .wav -> enhance -> split -> ASR

## Enhance
- background noise removal
- (audio normalization)

## Split
split long audio into chunks

## ASR Model
**Whisper**: one of the best available open-source models, by OpenAI  
    comes in many sizes and might be quantized even more
    sub-second inference speed
