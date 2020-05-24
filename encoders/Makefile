all: lame.wasm

lame/lame-src/dist/lib/libmp3lame.so:
	cd lame/lame-src && \
	git reset --hard && \
	emconfigure ./configure -C \
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
	  -DNDEBUG -Oz -Ilame/lame-src/dist/include \
		--pre-js pre-js.js \
		-s MALLOC=emmalloc \
		-s MINIMAL_RUNTIME \
		-s MODULARIZE \
		-s EXPORT_ES6 \
		-s "EXPORTED_FUNCTIONS=['_mrp_init','_mrp_free','_mrp_encode','_mrp_flush']" \
		-s ENVIRONMENT="worker,web" \
		-o dist/lame.js

clean:
	emmake $(MAKE) -C lame/lame-src distclean