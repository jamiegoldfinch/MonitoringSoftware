I've got the keylogger working now. I've decided to do a date header at the start. Then just to log everything.

# Keeping it running
- When the keylogger starts. It seems to be working ok. But when I open Task manager. 
I see that there are three NodeJS services running and three electron services running. 
I need to handle if the user tries to open task manager and close them. That they all 
keep each other running.