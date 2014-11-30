# Makefile for assets

PYTHON=python
LAME=lame

ASSETS=jump.mp3

all: $(ASSETS)

clean:
	-$(RM) $(ASSETS)

.SUFFIXES: .png .wav .mp3

.wav.mp3:
	$(LAME) $< $@

jump.mp3: jump.wav
