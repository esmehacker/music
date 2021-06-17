// noinspection JSXNamespaceValidation,DuplicatedCode

const Component = React.Component
const cookies = new UniversalCookie();
const SONGS_PATH = 'songs.json'

const COOKIE_OPTIONS = { secure: true, sameSite: 'lax' }

function onSongChange(songIndex) {
    cookies.set('current-song', songIndex, COOKIE_OPTIONS)
}

function onNoSongSet() {
    cookies.remove('current-song', COOKIE_OPTIONS)
}

async function retrieveSongs() {
    return await fetch(SONGS_PATH)
        .then(response => response.json())
}

function Header() {
    return <h1>My songs!</h1>
}

class Player extends Component {
    constructor(props) {
        super(props);

        this.onExit = this.onExit.bind(this)

        this.audioRef = React.createRef()
    }

    reload() {
        this.audioRef.current.pause()
        this.audioRef.current.load()
    }

    onExit() {
        this.audioRef.current.pause()
        this.props.onExit()
    }

    render() {
        return (<div className="audio-player">
            <a className="exit-button" onClick={this.onExit}>✕</a>
            <h3>{this.props.song.name}</h3>
            <p>{this.props.song.date}</p>
            <audio controls ref={this.audioRef} onError={this.props.onError}>
                <source src={this.props.audioDir + this.props.song.name} type="audio/mp3"/>
            </audio>
            {this.props.errorOccurred ?
                <p className="error-message">An error occurred loading this resource.</p>
            : null}
        </div>)
    }
}

function SongLink(props) {
    // noinspection JSUnresolvedVariable
    return (<a
        className={
            "song-link" +
            (props.disabled ? " disabled" : "") +
            (props.song.favourite ? " favourite" : "")
        }
        onClick={props.disabled ? null : (() => props.listenTo(props.song))}>
        {props.song.name}
    </a>)
}

function Collection(props) {
    return (<ul className="collection">
        {props.songs.map((song, index) => {
            return (<li key={index}>
                <SongLink
                    disabled={song === props.currentSong}
                    listenTo={props.listenTo}
                    song={song}
                />
            </li>)
        })}
    </ul>)
}

class Site extends Component {
    constructor(props) {
        super(props);

        this.pendingLayout = this.pendingLayout.bind(this)
        this.successLayout = this.successLayout.bind(this)
        this.failureLayout = this.failureLayout.bind(this)
        this.onAjaxSuccess = this.onAjaxSuccess.bind(this)
        this.onAjaxFailure = this.onAjaxFailure.bind(this)
        this.onPlayerError = this.onPlayerError.bind(this)
        this.onPlayerExit = this.onPlayerExit.bind(this)
        this.listenTo = this.listenTo.bind(this)

        this.playerRef = React.createRef()

        this.state = {
            ajaxState: "pending",
            songs: [],
            currentSong: null,
            playerErrorOccurred: false
        }

        retrieveSongs()
            .catch(this.onAjaxFailure)
            .then(this.onAjaxSuccess)
    }

    onAjaxSuccess(data) {
        let partialState = {
            ajaxState: "success",
            songs: data.songs
        }

        partialState.currentSong = data.songs[this.props.initialSongIndex]
        if (!partialState.currentSong) {
            this.props.onNoSongSet()
        }

        this.setState(partialState)
    }

    onAjaxFailure(error) {
        console.error(error)
        this.setState({
            ajaxState: "failure"
        })
    }

    onPlayerError() {
        this.setState({ playerErrorOccurred: true })
    }

    onPlayerExit() {
        this.setState({
            currentSong: null,
            playerErrorOccurred: false
        }, () => {
            this.props.onNoSongSet()
        })
    }

    listenTo(song) {
        this.setState({
            currentSong: song,
            playerErrorOccurred: false
        }, () => {
            this.playerRef.current.reload()
            this.props.onSongChange(this.state.songs.findIndex(s => s === song));
        })
    }

    pendingLayout() {
        return <p>Loading...</p>
    }

    successLayout() {
        return (<div className='react-container'>
            <Header/>
            {this.state.currentSong ?
                <Player
                    song={this.state.currentSong}
                    audioDir={this.props.audioDir}
                    ref={this.playerRef}
                    errorOccurred={this.state.playerErrorOccurred}
                    onError={this.onPlayerError}
                    onExit={this.onPlayerExit}/>
            : null}
            <Collection
                songs={this.state.songs}
                currentSong={this.state.currentSong}
                listenTo={this.listenTo}/>
        </div>)
    }

    failureLayout() {
        return <p>Failed to load songs :(</p>
    }

    render() {
        switch (this.state.ajaxState) {
            case "pending":
                return this.pendingLayout()
            case "success":
                return this.successLayout()
            case "failure":
                return this.failureLayout()
        }
    }
}

const initialSongIndex = cookies.get('current-song')
let root = document.getElementById("root")
ReactDOM.render(
    <Site
        audioDir="audio/"
        onSongChange={onSongChange}
        initialSongIndex={initialSongIndex}
        onNoSongSet={onNoSongSet}
    />,
    root)
