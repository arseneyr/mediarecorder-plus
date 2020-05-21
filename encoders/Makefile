all: lame.wasm

lame/lame-src/dist/lib/libmp3lame.so:
	cd lame/lame-src && \
	git reset --hard && \
	emconfigure ./configure \
		CFLAGS="-DNDEBUG -Oz -flto" \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--disable-static \
		\
		--disable-gtktest \
		--disable-analyzer-hooks \
		--disable-decoder \
		--disable-frontend \
		&& \
	emmake make -j8 && \
	emmake make install

lame.wasm: lame/lame-src/dist/lib/libmp3lame.so lame/lame_enc.c
	@mkdir -p dist
	emcc $^ \
	  -DNDEBUG -O0 -Ilame/lame-src/dist/include \
		-s NO_WASM_ASYNC_COMPILATION \
		-s MALLOC=emmalloc \
		-s MINIMAL_RUNTIME \
		-s MODULARIZE \
		-s "EXPORTED_FUNCTIONS=['_mrp_init']" \
		-s ENVIRONMENT="worker,web" \
		-o dist/lame.js

clean:
	emmake $(MAKE) -C lame/lame-src distclean