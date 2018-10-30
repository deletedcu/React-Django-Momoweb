TARGET_FILE = momoweb-0.0.1.zip

build:
	rm -f $(TARGET_FILE)
	git archive -o $(TARGET_FILE) HEAD

clean:
	rm -f momoweb-*.zip