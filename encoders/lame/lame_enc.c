#include <lame/lame.h>
#include <stdbool.h>
#include <stdlib.h>

// 30 seconds of audio at 48kHz
#define MP3_BUFFER_SIZE(num_samples) (1.25 * (num_samples) + 7200)
#define DEFAULT_MP3_SIZE MP3_BUFFER_SIZE(48000 * 30)

typedef struct _CFG {
  float *pcm_l;
  float *pcm_r;
  char *mp3_buffer;
  lame_global_flags *gfp;
} CFG, *PCFG;

void mrp_free(PCFG cfg) {
  if (cfg) {
    if (cfg->gfp) {
      lame_close(cfg->gfp);
    }
    if (cfg->pcm_l) {
      free(cfg->pcm_l);
    }
    if (cfg->pcm_r) {
      free(cfg->pcm_r);
    }
    if (cfg->mp3_buffer) {
      free(cfg->mp3_buffer);
    }
    free(cfg);
  }
}

PCFG mrp_init(bool streaming, unsigned int sample_rate,
              unsigned int sample_count, unsigned int channel_count,
              unsigned int vbr_quality, unsigned int cbr_rate) {
  PCFG cfg = NULL;
  if (channel_count > 2 || (vbr_quality == 0) == (cbr_rate == 0)) {
    goto Cleanup;
  }

  cfg = calloc(1, sizeof(CFG));
  if (!cfg) {
    goto Cleanup;
  }
  cfg->pcm_l = malloc(sample_count * sizeof(*cfg->pcm_l));
  cfg->pcm_r = malloc(sample_count * sizeof(*cfg->pcm_r));
  cfg->mp3_buffer =
      malloc(streaming ? MP3_BUFFER_SIZE(sample_count) : DEFAULT_MP3_SIZE);
  cfg->gfp = lame_init();
  if (!cfg->pcm_l || !cfg->pcm_r || !cfg->mp3_buffer || !cfg->gfp) {
    goto Cleanup;
  }

  lame_set_num_channels(cfg->gfp, channel_count);
  if (vbr_quality) {
    lame_set_VBR(cfg->gfp, vbr_default);
    lame_set_VBR_quality(cfg->gfp, vbr_quality);
  } else {
    lame_set_VBR(cfg->gfp, vbr_off);
    lame_set_brate(cfg->gfp, cbr_rate);
  }
  if (lame_init_params(cfg->gfp) < 0) {
    goto Cleanup;
  }

  return cfg;

Cleanup:
  mrp_free(cfg);
  return NULL;
}
