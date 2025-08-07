export interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
}

export const betterStackMonitoringTranscript: TranscriptSegment[] = [
  {
    id: '1',
    timestamp: '0:00',
    text: "Let's have a look how basic monitoring works in better stack. We have a few options for creating the monitor. Firstly, we can use the toggle down menu here and shortcut to creating the monitor that you need."
  },
  {
    id: '2',
    timestamp: '0:10',
    text: "Otherwise, you can go ahead and click the button here. Here, you can choose from all the different monitoring options to check your services."
  },
  {
    id: '3',
    timestamp: '0:16',
    text: "You can choose the basic unavailability monitors and include the URL that you'd like to check. You can choose keyword monitors, simply fill out the URL and the keyword that you are looking to find, or not find on the page."
  },
  {
    id: '4',
    timestamp: '0:28',
    text: "You can also choose ping monitors or even transaction monitors, like the playwrights scenarios. With the playwrights scenarios, you get to write the script that you are expecting to run, and if the scenario doesn't run the way it should, you will get alerted."
  },
  {
    id: '5',
    timestamp: '0:41',
    text: "Once you have your monitoring choice selected, the next step is selecting the on-call escalation. For this video, we're looking at the simple escalation and whether you'd like to receive a call, an SMS, email, or a push notification."
  },
  {
    id: '6',
    timestamp: '0:52',
    text: "If you'd like to see how you can configure your escalation further, I'd recommend watching the advance escalation video. In the advanced settings, you'll have the options to set up the check frequency of the monitor, confirmation periods, domain expiration, SSL expiration, and also any recurring maintenance"
  },
  {
    id: '7',
    timestamp: '1:06',
    text: "windows. Please watch the advanced monitors configuration for more details on these. Once you're ready, go ahead and create the monitor."
  },
  {
    id: '8',
    timestamp: '1:12',
    text: "Once you have your monitor created, you'll get an overview with the response time chart for all of the regions from which you are checking the monitor, how long the monitor has been up, the last check, and any number of incidents that it experienced."
  },
  {
    id: '9',
    timestamp: '1:23',
    text: "at the bottom of the overview, you'll see the availability chart and you'll be able to calculate the availability of the particular monitor for a specific time period."
  },
  {
    id: '10',
    timestamp: '1:32',
    text: "If needed, you can also zoom in on any data spikes in your response times, zoom in and debug even in more detail."
  },
  {
    id: '11',
    timestamp: '1:37',
    text: "If you'd like to reconfigure an already existing monitor, you can do that easily through here and you'll see the same settings as I just showed you."
  },
  {
    id: '12',
    timestamp: '1:44',
    text: "All of your monitors will then pop up in the main monitor's tab here where you'll be able to move them to a different group."
  },
  {
    id: '13',
    timestamp: '1:52',
    text: "Pause or unpause all at once and organize exactly as you need. Thanks for watching."
  }
]; 