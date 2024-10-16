# NEXT IN LINE
- None of the emailing seems to work because it looks like it requires the monitoring.html window to still 
be active in order to work. 
- Next time, I am going to try to detach the keylogger and watchdog processes seperately from the electron window
as well as try to keep the electron window active in the background somehow. The watchdog will need to make sure
that this starts back up if the user shuts it down.
- I need to somehow remove the renderer.js reference in the index.html and rely on the preload. But it doesn't seem to be working.


# THINGS TO GET DONE WITH THE SOFTWARE
- Go over the keylogging process and make sure that the keys are logged properly and not some CAPS LEFT or stuff like that.
- Organise emailing to the accountability partner. I'll need to think about when and how to send it
- I'd like to monitor pages for key words.
- I'd like to incorporate snapshots of the pages. When would I take the snapshots?
- I need to prevent changes to the setup-details.json file
- For emailing, I notice that it requires the persons email and password to be able to send emails on their behalf to the accountability partner.
- How would it know what service I am using (i.e. gmail)?



# SUCCESSES
- It now runs continuously and restarts if it was stopped.
- The keylogger text looks pretty good and doesn't look like gibberish.



# Keylog strokes that need fixing
- Every now and then I type in a space or a full stop and it doesn't seem to work.

