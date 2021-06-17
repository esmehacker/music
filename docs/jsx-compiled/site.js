// noinspection JSXNamespaceValidation,DuplicatedCode
const Component = React.Component;
const cookies = new UniversalCookie();
const SONGS_PATH = 'songs.json';
const COOKIE_OPTIONS = {
  secure: true,
  sameSite: 'lax'
};

function onSongChange(songIndex) {
  cookies.set('current-song', songIndex, COOKIE_OPTIONS);
}

function onNoSongSet() {
  cookies.remove('current-song', COOKIE_OPTIONS);
}

async function retrieveSongs() {
  return await fetch(SONGS_PATH).then(response => response.json());
}

function Header() {
  return /*#__PURE__*/React.createElement("h1", null, "My songs!");
}

class Player extends Component {
  constructor(props) {
    super(props);
    this.onExit = this.onExit.bind(this);
    this.audioRef = React.createRef();
  }

  reload() {
    this.audioRef.current.pause();
    this.audioRef.current.load();
  }

  onExit() {
    this.audioRef.current.pause();
    this.props.onExit();
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "audio-player"
    }, /*#__PURE__*/React.createElement("a", {
      className: "exit-button",
      onClick: this.onExit
    }, "\u2715"), /*#__PURE__*/React.createElement("h3", null, this.props.song.name), /*#__PURE__*/React.createElement("p", null, this.props.song.date), /*#__PURE__*/React.createElement("audio", {
      controls: true,
      ref: this.audioRef,
      onError: this.props.onError
    }, /*#__PURE__*/React.createElement("source", {
      src: this.props.audioDir + this.props.song.name,
      type: "audio/mp3"
    })), this.props.errorOccurred ? /*#__PURE__*/React.createElement("p", {
      className: "error-message"
    }, "An error occurred loading this resource.") : null);
  }

}

function SongLink(props) {
  // noinspection JSUnresolvedVariable
  return /*#__PURE__*/React.createElement("a", {
    className: "song-link" + (props.disabled ? " disabled" : "") + (props.song.favourite ? " favourite" : ""),
    onClick: props.disabled ? null : () => props.listenTo(props.song)
  }, props.song.name);
}

function Collection(props) {
  return /*#__PURE__*/React.createElement("ul", {
    className: "collection"
  }, props.songs.map((song, index) => {
    let disabled = song === props.currentSong;
    return /*#__PURE__*/React.createElement("li", {
      key: index
    }, /*#__PURE__*/React.createElement(SongLink, {
      disabled: song === props.currentSong,
      listenTo: props.listenTo,
      song: song
    }));
  }));
}

class Site extends Component {
  constructor(props) {
    super(props);
    this.pendingLayout = this.pendingLayout.bind(this);
    this.successLayout = this.successLayout.bind(this);
    this.failureLayout = this.failureLayout.bind(this);
    this.onAjaxSuccess = this.onAjaxSuccess.bind(this);
    this.onAjaxFailure = this.onAjaxFailure.bind(this);
    this.onPlayerError = this.onPlayerError.bind(this);
    this.onPlayerExit = this.onPlayerExit.bind(this);
    this.listenTo = this.listenTo.bind(this);
    this.playerRef = React.createRef();
    this.state = {
      ajaxState: "pending",
      songs: [],
      currentSong: null,
      playerErrorOccurred: false
    };
    retrieveSongs().catch(this.onAjaxFailure).then(this.onAjaxSuccess);
  }

  onAjaxSuccess(data) {
    let partialState = {
      ajaxState: "success",
      songs: data.songs
    };
    partialState.currentSong = data.songs[this.props.initialSongIndex];

    if (!partialState.currentSong) {
      this.props.onNoSongSet();
    }

    this.setState(partialState);
  }

  onAjaxFailure(error) {
    console.error(error);
    this.setState({
      ajaxState: "failure"
    });
  }

  onPlayerError() {
    this.setState({
      playerErrorOccurred: true
    });
  }

  onPlayerExit() {
    this.setState({
      currentSong: null,
      playerErrorOccurred: false
    }, () => {
      this.props.onNoSongSet();
    });
  }

  listenTo(song) {
    this.setState({
      currentSong: song,
      playerErrorOccurred: false
    }, () => {
      this.playerRef.current.reload();
      this.props.onSongChange(this.state.songs.findIndex(s => s === song));
    });
  }

  pendingLayout() {
    return /*#__PURE__*/React.createElement("p", null, "Loading...");
  }

  successLayout() {
    return /*#__PURE__*/React.createElement("div", {
      className: "react-container"
    }, /*#__PURE__*/React.createElement(Header, null), this.state.currentSong ? /*#__PURE__*/React.createElement(Player, {
      song: this.state.currentSong,
      audioDir: this.props.audioDir,
      ref: this.playerRef,
      errorOccurred: this.state.playerErrorOccurred,
      onError: this.onPlayerError,
      onExit: this.onPlayerExit
    }) : null, /*#__PURE__*/React.createElement(Collection, {
      songs: this.state.songs,
      currentSong: this.state.currentSong,
      listenTo: this.listenTo
    }), /*#__PURE__*/React.createElement("p", {
      className: "footnote"
    }));
  }

  failureLayout() {
    return /*#__PURE__*/React.createElement("p", null, "Failed to load songs :(");
  }

  render() {
    switch (this.state.ajaxState) {
      case "pending":
        return this.pendingLayout();

      case "success":
        return this.successLayout();

      case "failure":
        return this.failureLayout();
    }
  }

}

const initialSongIndex = cookies.get('current-song');
let root = document.getElementById("root");
ReactDOM.render( /*#__PURE__*/React.createElement(Site, {
  audioDir: "audio/",
  onSongChange: onSongChange,
  initialSongIndex: initialSongIndex,
  onNoSongSet: onNoSongSet
}), root);