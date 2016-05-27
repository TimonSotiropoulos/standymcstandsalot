#Image Variables
slackup_bot_image=seed/standup-bot

# Command to build the local image when attempting to do a DBMigration
build-standup-bot: build-standup-bot-image push-to-dockerhub

build-standup-bot-image:
	@echo running docker build
	docker build -t $(slackup_bot_image):latest .
	$(eval export current_image=$(slackup_bot_image):latest)

# Generic function for pushing to dockerhub
push-to-dockerhub:
	@echo "\nPushing $(current_image) to Docker Hub"
	docker push $(current_image)
